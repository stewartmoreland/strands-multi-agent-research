/**
 * Shared types and interfaces for specialist agents.
 */

/**
 * Configuration for specialist agents
 */
export interface SpecialistConfig {
  /** AWS region for AgentCore services */
  region: string;
  /** Model ID to use for the specialist agent */
  modelId: string;
  /** Whether to use AgentCore tools (vs local fallback) */
  useAgentCore: boolean;
}

/**
 * Result from a specialist agent invocation
 */
export interface SpecialistResult {
  /** The main text response */
  text: string;
  /** Optional structured data */
  data?: Record<string, unknown>;
  /** Sources or citations */
  sources?: string[];
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Input schema types for research specialist
 */
export interface ResearchInput {
  task: string;
  urls?: string[];
  context?: string;
}

/**
 * Input schema types for analysis specialist
 */
export interface AnalysisInput {
  task: string;
  data?: string;
  previousNotes?: string;
  language?: "python" | "javascript" | "typescript";
}

/**
 * Input schema types for writing specialist
 */
export interface WritingInput {
  task: string;
  previousNotes?: string;
  format?: "summary" | "report" | "bullet_points";
}

/**
 * Output format options for writing specialist
 */
export type OutputFormat = "summary" | "report" | "bullet_points";

/**
 * Get default specialist configuration from environment
 */
export function getSpecialistConfig(): SpecialistConfig {
  const toolsEnabled = process.env.AGENTCORE_TOOLS_ENABLED;
  const isProduction = process.env.NODE_ENV === "production";

  return {
    region: process.env.AWS_REGION || "us-east-1",
    modelId:
      process.env.BEDROCK_MODEL_ID ||
      "us.anthropic.claude-sonnet-4-20250514-v1:0",
    useAgentCore: toolsEnabled === "true" || isProduction,
  };
}
