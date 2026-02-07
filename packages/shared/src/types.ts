/**
 * Shared types for the multi-agent research system.
 */

/**
 * Request payload for the agent invocation endpoint.
 */
export interface InvocationRequest {
  prompt: string;
  sessionId?: string;
  userId?: string;
  /** Bedrock foundation model ID (e.g. us.anthropic.claude-sonnet-4-20250514-v1:0). Overrides BEDROCK_MODEL_ID when set. */
  modelId?: string;
}

/**
 * Summary of a Bedrock foundation model (from ListFoundationModels).
 * Used by the web app to populate the model selector.
 */
export interface FoundationModelSummary {
  modelId: string;
  modelName?: string;
  providerName?: string;
  modelLifecycle?: { status?: string };
  outputModalities?: string[];
  responseStreamingSupported?: boolean;
  inferenceTypesSupported?: string[];
}

/**
 * Message role in a conversation.
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * A message in the conversation history.
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

/**
 * Tool execution status for timeline display.
 */
export type ToolStatus = "pending" | "running" | "completed" | "failed";

/**
 * A tool execution entry for the thinking timeline.
 */
export interface ToolExecution {
  id: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  status: ToolStatus;
  startTime: number;
  endTime?: number;
}

/**
 * Session state for the research interface.
 */
export interface SessionState {
  sessionId: string;
  messages: Message[];
  toolExecutions: ToolExecution[];
  isStreaming: boolean;
}
