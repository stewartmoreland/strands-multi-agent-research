/**
 * Research Specialist Agent
 *
 * Uses AgentCore Browser for web research tasks including:
 * - Browsing web pages to gather information
 * - Extracting content from URLs
 * - Returning sourced notes with citations
 *
 * Falls back to simulated results when AgentCore is not available.
 */

import { Agent, BedrockModel, tool } from "@strands-agents/sdk";
import { z } from "zod";
import { getSpecialistConfig, type ResearchInput } from "./types";

/**
 * System prompt for the research specialist agent
 */
const RESEARCH_SYSTEM_PROMPT = `You are a web research specialist agent. Your role is to:

1. Browse web pages to gather information on the given topic
2. Extract relevant content and data from web sources
3. Organize findings into clear, sourced notes
4. Cite your sources with URLs when possible

When conducting research:
- Focus on authoritative and reliable sources
- Extract key facts, statistics, and quotes
- Note the publication date and author when available
- Summarize findings in a structured format

Always provide citations in the format: [Source: URL or description]`;

/**
 * Create the research agent with browser tools when available.
 * @param config - Specialist config (use getSpecialistConfig({ modelId }) for per-request model).
 */
async function createResearchAgent(
  config: ReturnType<typeof getSpecialistConfig>,
): Promise<Agent | null> {
  if (!config.useAgentCore) {
    console.log(
      "[Research Specialist] AgentCore disabled, using local fallback",
      config,
    );
    return null;
  }

  try {
    // Dynamically import browser tools to handle cases where package is not available
    const { BrowserTools } =
      await import("bedrock-agentcore/experimental/browser/strands");

    const browserTools = new BrowserTools({ region: config.region });

    const agent = new Agent({
      model: new BedrockModel({
        modelId: config.modelId,
        region: config.region,
      }),
      tools: browserTools.tools,
      systemPrompt: RESEARCH_SYSTEM_PROMPT,
      printer: false,
    });

    console.log("[Research Specialist] Initialized with AgentCore Browser");
    return agent;
  } catch (error) {
    console.warn(
      "[Research Specialist] Failed to initialize AgentCore Browser:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// Cache by modelId so we reuse agents when the same model is selected
const researchAgentCache = new Map<string, Agent | null>();

/**
 * Get or create the research agent for the given model (or default config).
 */
async function getResearchAgent(modelId?: string): Promise<Agent | null> {
  const config = getSpecialistConfig(modelId != null ? { modelId } : undefined);
  const key = config.modelId;
  let agent = researchAgentCache.get(key);
  if (agent === undefined) {
    agent = await createResearchAgent(config);
    researchAgentCache.set(key, agent ?? null);
  }
  return agent;
}

/** Invocation timeout in ms (90s) so the orchestrator does not hang if Bedrock/Browser stalls */
const INVOKE_TIMEOUT_MS = 90_000;

/**
 * Return fallback research notes when agent is unavailable or invoke fails/times out
 */
function getFallbackResearch(
  task: string,
  urls?: string[],
  context?: string,
): string {
  return [
    `Research findings for: "${task}"`,
    context ? `Context: ${context.substring(0, 100)}...` : "",
    urls?.length ? `URLs analyzed: ${urls.join(", ")}` : "",
    "",
    "Key findings:",
    "1. [Source: Web Search] Found relevant information about the topic",
    "2. [Source: API Data] Retrieved structured data from available sources",
    "3. [Source: Documentation] Gathered reference materials",
    "",
    "Note: This is a simulated response. Enable AgentCore Browser for real web research.",
    "",
    "Summary: Research completed with available sources.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Perform research using the agent or fallback.
 * Wraps agent.invoke in a timeout so the orchestrator always gets a result.
 */
async function performResearch(
  input: ResearchInput,
  modelId?: string,
): Promise<string> {
  const { task, urls, context } = input;

  const agent = await getResearchAgent(modelId);

  if (agent) {
    const urlList = urls?.length
      ? `\n\nRelevant URLs to explore:\n${urls.map((u) => `- ${u}`).join("\n")}`
      : "";
    const contextInfo = context ? `\n\nAdditional context: ${context}` : "";
    const prompt = `Research task: ${task}${urlList}${contextInfo}\n\nPlease conduct thorough research and provide detailed findings with sources.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Research specialist invocation timed out")),
        INVOKE_TIMEOUT_MS,
      );
    });

    try {
      const result = await Promise.race([agent.invoke(prompt), timeoutPromise]);
      const message = result.lastMessage;
      if (message) {
        const textParts: string[] = [];
        for (const block of message.content) {
          if (block.type === "textBlock") {
            textParts.push(block.text);
          }
        }
        const text = textParts.join("\n");
        if (text) {
          return text;
        }
      }
    } catch (error) {
      console.error("[Research Specialist] Agent invocation failed:", error);
      console.log(`[Research Specialist] Using fallback for: ${task}`);
      return getFallbackResearch(task, urls, context);
    }
  }

  console.log(`[Research Specialist] Using fallback for: ${task}`);
  return getFallbackResearch(task, urls, context);
}

/**
 * Research Specialist Tool
 *
 * Wraps the research agent as a tool for the orchestrator.
 * Uses AgentCore Browser when available, falls back to simulation otherwise.
 */
export const researchTool = tool({
  name: "research_specialist",
  description:
    "Web research specialist: browse web, extract information, return sourced notes. Use this tool when you need to gather information from the web about a topic.",
  inputSchema: z.object({
    task: z.string().describe("The research task or question to investigate"),
    urls: z
      .array(z.string().url())
      .optional()
      .describe("Specific URLs to browse and extract information from"),
    context: z
      .string()
      .optional()
      .describe("Additional context or constraints for the research"),
  }),
  callback: async ({ task, urls, context }) => {
    console.log(`[Research Specialist] Processing: ${task}`);
    const result = await performResearch({ task, urls, context });
    return result;
  },
});

/**
 * Create a research tool that uses the given model ID (for per-request model selection).
 */
export function createResearchTool(modelId: string) {
  return tool({
    name: "research_specialist",
    description:
      "Web research specialist: browse web, extract information, return sourced notes. Use this tool when you need to gather information from the web about a topic.",
    inputSchema: z.object({
      task: z.string().describe("The research task or question to investigate"),
      urls: z
        .array(z.string().url())
        .optional()
        .describe("Specific URLs to browse and extract information from"),
      context: z
        .string()
        .optional()
        .describe("Additional context or constraints for the research"),
    }),
    callback: async ({ task, urls, context }) => {
      console.log(`[Research Specialist] Processing: ${task}`);
      return performResearch({ task, urls, context }, modelId);
    },
  });
}
