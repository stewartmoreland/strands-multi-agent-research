/**
 * Orchestrator that coordinates specialist agents using Strands Agents SDK.
 * Uses Amazon Bedrock for LLM inference with real-time streaming.
 */

import type { UiEvent } from "@repo/shared/events";
import { memoryAdapter } from "@repo/util";
import { logger } from "./logger.js";
import { Agent, BedrockModel } from "@strands-agents/sdk";
import {
  createAnalysisTool,
  createResearchTool,
  createWritingTool,
  getDefaultModelId,
} from "./specialists/index.js";

interface OrchestratorContext {
  sessionId?: string;
  userId?: string;
  /** Bedrock model ID for this invocation (overrides BEDROCK_MODEL_ID when set). */
  modelId?: string;
}

const region = process.env.AWS_REGION || "us-east-1";

/**
 * System prompt for the orchestrator agent
 */
const SYSTEM_PROMPT = `You are a helpful AI research assistant with access to specialist tools.
You can use these tools to help answer questions:

1. research_specialist - For gathering information from various sources
2. analysis_specialist - For data analysis and computations
3. writing_specialist - For synthesizing findings into coherent responses (produces Markdown suitable for rich display: GFM, code blocks with syntax highlighting, mermaid diagrams, and optionally math)

When answering questions:
- Use the appropriate tools when they would be helpful
- Provide clear, well-structured responses
- Be concise but thorough
- Cite your reasoning when appropriate

If you don't need to use tools, respond directly to the user's question.`;

const agentCache = new Map<string, Agent>();

/**
 * Get or create the orchestrator Agent for the given model ID.
 * Orchestrator and specialist tools all use this model.
 */
function getOrchestratorAgent(modelId: string): Agent {
  let agent = agentCache.get(modelId);
  if (!agent) {
    agent = new Agent({
      model: new BedrockModel({ modelId, region }),
      tools: [
        createResearchTool(modelId),
        createAnalysisTool(modelId),
        createWritingTool(modelId),
      ],
      systemPrompt: SYSTEM_PROMPT,
      printer: false,
    });
    agentCache.set(modelId, agent);
  }
  return agent;
}

/**
 * Orchestrator that coordinates specialist agents
 */
export const orchestrator = {
  /**
   * Stream events while processing the prompt using the Strands Agent
   */
  async *stream(
    prompt: string,
    context: OrchestratorContext,
  ): AsyncGenerator<UiEvent> {
    const { sessionId, userId, modelId } = context;
    const effectiveModelId = modelId ?? getDefaultModelId();
    const agent = getOrchestratorAgent(effectiveModelId);

    // Log user message to memory if we have context
    if (sessionId && userId) {
      try {
        await memoryAdapter.logConversationEvent(
          userId,
          sessionId,
          "user",
          prompt,
        );
      } catch (error) {
        logger.warn("Failed to log user message to memory", { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Retrieve relevant memories for context
    let recallContext = "";
    if (userId) {
      try {
        const memories = await memoryAdapter.recall(userId, prompt, 3);
        if (memories.length > 0) {
          recallContext = `\n\nRelevant context from previous conversations:\n${memories
            .map((m) => `- ${m}`)
            .join("\n")}\n`;
        }
      } catch (error) {
        logger.warn("Failed to retrieve memories", { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Prepare the prompt with any recalled context
    const fullPrompt = recallContext
      ? `${recallContext}\n\nUser question: ${prompt}`
      : prompt;

    let fullResponse = "";

    try {
      for await (const event of agent.stream(fullPrompt)) {
        // Map Strands events to UI events
        const uiEvent = mapStrandsEventToUiEvent(event);
        if (uiEvent) {
          // Track the full response for memory logging
          if (uiEvent.type === "message.delta") {
            fullResponse += uiEvent.text;
          }
          yield uiEvent;
        }
      }
    } catch (error) {
      logger.error("Agent stream error", undefined, error instanceof Error ? error : new Error(String(error)));
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      yield { type: "error", message: errorMessage };
    }

    // Log assistant response to memory
    if (sessionId && userId && fullResponse) {
      try {
        await memoryAdapter.logConversationEvent(
          userId,
          sessionId,
          "assistant",
          fullResponse,
        );
      } catch (error) {
        logger.warn("Failed to log assistant message to memory", { error: error instanceof Error ? error.message : String(error) });
      }
    }
  },

  /**
   * Non-streaming invocation
   */
  async invoke(prompt: string, context: OrchestratorContext): Promise<string> {
    let result = "";
    for await (const event of this.stream(prompt, context)) {
      if (event.type === "message.delta") {
        result += event.text;
      }
    }
    return result.trim();
  },
};

/**
 * Serialize a Strands ToolResultBlock to a string for tool.end output.
 * Handles content array (textBlock, jsonBlock) and error status.
 */
function toolResultBlockToString(result: Record<string, unknown>): string {
  if (result.status === "error" && result.error) {
    const err = result.error as Error | { message?: string };
    const msg = err?.message;
    if (typeof msg === "string") return msg;
    return "Tool execution failed";
  }
  const content = result.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content) || content.length === 0) {
    return "";
  }
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "textBlock" && typeof block.text === "string") {
      parts.push(block.text);
    } else if (block.type === "jsonBlock") {
      parts.push(JSON.stringify(block.data ?? block));
    }
  }
  return parts.join("\n");
}

/**
 * Map Strands SDK events to our UI event format.
 * Strands emits: modelContentBlockDeltaEvent, beforeToolCallEvent, afterToolCallEvent, modelMessageStopEvent, agentResult.
 */
function mapStrandsEventToUiEvent(event: unknown): UiEvent | null {
  if (!event || typeof event !== "object") {
    return null;
  }

  const evt = event as Record<string, unknown>;

  // Message and thinking deltas: Strands uses modelContentBlockDeltaEvent with delta.type textDelta | reasoningContentDelta
  if (evt.type === "modelContentBlockDeltaEvent") {
    const delta = evt.delta as Record<string, unknown> | undefined;
    if (!delta) return null;
    if (delta.type === "textDelta" && typeof delta.text === "string") {
      return { type: "message.delta", text: delta.text };
    }
    if (delta.type === "reasoningContentDelta") {
      const text = (delta.text as string) ?? "";
      return { type: "thinking.delta", text };
    }
    return null;
  }

  // Tool start: Strands uses beforeToolCallEvent with toolUse.name and toolUse.input
  if (evt.type === "beforeToolCallEvent") {
    const toolUse = evt.toolUse as Record<string, unknown> | undefined;
    const toolName =
      (toolUse?.name as string) ?? (evt.toolName as string) ?? "unknown";
    const input = toolUse?.input ?? evt.input ?? {};
    return { type: "tool.start", toolName, input };
  }

  // Tool end: Strands uses afterToolCallEvent with toolUse.name and result (ToolResultBlock)
  if (evt.type === "afterToolCallEvent") {
    const toolUse = evt.toolUse as Record<string, unknown> | undefined;
    const toolName =
      (toolUse?.name as string) ?? (evt.toolName as string) ?? "unknown";
    const result = evt.result as Record<string, unknown> | undefined;
    const output =
      result != null
        ? toolResultBlockToString(result)
        : ((evt.output as string) ?? "");
    return { type: "tool.end", toolName, output };
  }

  // Message completion: Strands uses modelMessageStopEvent or agentResult
  if (evt.type === "modelMessageStopEvent" || evt.type === "agentResult") {
    return { type: "message.done" };
  }

  // Errors
  if (evt.type === "error") {
    const message =
      (evt.message as string) ?? (evt.error as string) ?? "Unknown error";
    return { type: "error", message };
  }

  if (process.env.NODE_ENV === "development") {
    logger.debug("Unhandled Strands event", { type: evt.type, event: evt });
  }

  return null;
}
