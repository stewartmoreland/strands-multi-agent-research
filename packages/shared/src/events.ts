/**
 * UI Event types for streaming from the agent runtime to the frontend.
 * These are the stable event shapes that the frontend should consume.
 */

export interface MetaEvent {
  type: "meta";
  sessionId: string;
}

export interface MessageDeltaEvent {
  type: "message.delta";
  text: string;
}

export interface ThinkingDeltaEvent {
  type: "thinking.delta";
  text: string;
}

export interface ToolStartEvent {
  type: "tool.start";
  toolName: string;
  input: unknown;
}

export interface ToolEndEvent {
  type: "tool.end";
  toolName: string;
  output: unknown;
}

export interface MessageDoneEvent {
  type: "message.done";
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

/** Emitted at the start of each invocation so the UI can group events per run. */
export interface RunStartEvent {
  type: "run.start";
}

export type UiEvent =
  | MetaEvent
  | MessageDeltaEvent
  | ThinkingDeltaEvent
  | ToolStartEvent
  | ToolEndEvent
  | MessageDoneEvent
  | ErrorEvent
  | RunStartEvent;

/**
 * Type guard functions for UiEvent
 */
export function isMetaEvent(event: UiEvent): event is MetaEvent {
  return event.type === "meta";
}

export function isMessageDeltaEvent(
  event: UiEvent,
): event is MessageDeltaEvent {
  return event.type === "message.delta";
}

export function isThinkingDeltaEvent(
  event: UiEvent,
): event is ThinkingDeltaEvent {
  return event.type === "thinking.delta";
}

export function isToolStartEvent(event: UiEvent): event is ToolStartEvent {
  return event.type === "tool.start";
}

export function isToolEndEvent(event: UiEvent): event is ToolEndEvent {
  return event.type === "tool.end";
}

export function isMessageDoneEvent(event: UiEvent): event is MessageDoneEvent {
  return event.type === "message.done";
}

export function isErrorEvent(event: UiEvent): event is ErrorEvent {
  return event.type === "error";
}

export function isRunStartEvent(event: UiEvent): event is RunStartEvent {
  return event.type === "run.start";
}
