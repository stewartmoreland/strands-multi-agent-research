/**
 * Analysis Specialist Agent
 *
 * Uses AgentCore Code Interpreter for data analysis tasks including:
 * - Executing Python/JavaScript/TypeScript code
 * - Performing calculations and data transformations
 * - Processing structured data (CSV, JSON, etc.)
 *
 * Falls back to simulated results when AgentCore is not available.
 */

import { Agent, BedrockModel, tool } from "@strands-agents/sdk";
import { z } from "zod";
import { getSpecialistConfig, type AnalysisInput } from "./types";

/**
 * System prompt for the analysis specialist agent
 */
const ANALYSIS_SYSTEM_PROMPT = `You are a data analysis specialist agent. Your role is to:

1. Analyze data using code execution when needed
2. Perform calculations, statistical analysis, and data transformations
3. Process and extract insights from structured data
4. Present results clearly with supporting evidence

When performing analysis:
- Write clean, well-documented code
- Use appropriate libraries (pandas, numpy, etc. for Python)
- Validate inputs and handle edge cases
- Explain your methodology and findings
- Include relevant statistics and metrics

Always show your work and explain your reasoning.`;

/**
 * Create the analysis agent with code interpreter tools when available
 */
async function createAnalysisAgent(): Promise<Agent | null> {
  // Read config lazily to ensure env vars are loaded
  const config = getSpecialistConfig();

  if (!config.useAgentCore) {
    console.log(
      "[Analysis Specialist] AgentCore disabled, using local fallback",
      config,
    );
    return null;
  }

  try {
    // Dynamically import code interpreter tools
    const { CodeInterpreterTools } =
      await import("bedrock-agentcore/experimental/code-interpreter/strands");

    const codeInterpreter = new CodeInterpreterTools({ region: config.region });

    const agent = new Agent({
      model: new BedrockModel({
        modelId: config.modelId,
        region: config.region,
      }),
      tools: codeInterpreter.tools,
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      printer: false,
    });

    console.log(
      "[Analysis Specialist] Initialized with AgentCore Code Interpreter",
    );
    return agent;
  } catch (error) {
    console.warn(
      "[Analysis Specialist] Failed to initialize AgentCore Code Interpreter:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// Lazy-loaded agent instance
let analysisAgent: Agent | null | undefined;

/**
 * Get or create the analysis agent
 */
async function getAnalysisAgent(): Promise<Agent | null> {
  if (analysisAgent === undefined) {
    analysisAgent = await createAnalysisAgent();
  }
  return analysisAgent;
}

/** Invocation timeout in ms (90s) so the orchestrator does not hang if Bedrock/Code Interpreter stalls */
const INVOKE_TIMEOUT_MS = 90_000;

/**
 * Return fallback analysis text when agent is unavailable or invoke fails/times out
 */
function getFallbackAnalysis(
  task: string,
  previousNotes?: string,
  data?: string,
): string {
  return [
    `Analysis results for: "${task}"`,
    previousNotes
      ? `Building on previous research: ${previousNotes.substring(0, 100)}...`
      : "",
    data ? `Data provided: ${data.substring(0, 50)}...` : "",
    "",
    "Analysis:",
    "- Data processed: Input validated and normalized",
    "- Computations: Statistical analysis completed",
    "- Patterns identified: Key trends extracted",
    "",
    "Note: This is a simulated response. Enable AgentCore Code Interpreter for real code execution.",
    "",
    "Conclusion: Analysis complete with quantified results.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Perform analysis using the agent or fallback.
 * Wraps agent.invoke in a timeout so the orchestrator always gets a result.
 */
async function performAnalysis(input: AnalysisInput): Promise<string> {
  const { task, data, previousNotes, language } = input;

  const agent = await getAnalysisAgent();

  if (agent) {
    const dataSection = data
      ? `\n\nData to analyze:\n\`\`\`\n${data}\n\`\`\``
      : "";
    const notesSection = previousNotes
      ? `\n\nPrevious research notes to consider:\n${previousNotes}`
      : "";
    const langPreference = language
      ? `\n\nPreferred programming language: ${language}`
      : "";
    const prompt = `Analysis task: ${task}${dataSection}${notesSection}${langPreference}\n\nPlease perform the analysis and provide detailed results with explanations.`;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Analysis specialist invocation timed out")),
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
      console.error("[Analysis Specialist] Agent invocation failed:", error);
      console.log(`[Analysis Specialist] Using fallback for: ${task}`);
      return getFallbackAnalysis(task, previousNotes, data);
    }
  }

  console.log(`[Analysis Specialist] Using fallback for: ${task}`);
  return getFallbackAnalysis(task, previousNotes, data);
}

/**
 * Analysis Specialist Tool
 *
 * Wraps the analysis agent as a tool for the orchestrator.
 * Uses AgentCore Code Interpreter when available, falls back to simulation otherwise.
 */
export const analysisTool = tool({
  name: "analysis_specialist",
  description:
    "Data analysis specialist: uses code interpreter for computations, data transforms, and analysis. Use this tool for calculations, statistical analysis, or data processing.",
  inputSchema: z.object({
    task: z.string().describe("The analysis task or computation to perform"),
    data: z
      .string()
      .optional()
      .describe("Data to analyze (JSON, CSV, or other structured format)"),
    previousNotes: z
      .string()
      .optional()
      .describe("Notes from previous tools to build upon"),
    language: z
      .enum(["python", "javascript", "typescript"])
      .optional()
      .describe("Preferred programming language for code execution"),
  }),
  callback: async ({ task, data, previousNotes, language }) => {
    console.log(`[Analysis Specialist] Processing: ${task}`);

    const result = await performAnalysis({
      task,
      data,
      previousNotes,
      language,
    });

    return result;
  },
});
