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
