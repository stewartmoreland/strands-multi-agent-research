import { describe, expect, it } from "vitest";
import {
  isErrorEvent,
  isMessageDeltaEvent,
  isMessageDoneEvent,
  isMetaEvent,
  isRunStartEvent,
  isThinkingDeltaEvent,
  isToolEndEvent,
  isToolStartEvent,
  type UiEvent,
} from "./events";

describe("events type guards", () => {
  describe("isMetaEvent", () => {
    it("returns true for meta event", () => {
      const event: UiEvent = { type: "meta", sessionId: "s1" };
      expect(isMetaEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isMetaEvent({ type: "message.delta", text: "x" })).toBe(false);
      expect(isMetaEvent({ type: "run.start" })).toBe(false);
    });
  });

  describe("isMessageDeltaEvent", () => {
    it("returns true for message.delta event", () => {
      const event: UiEvent = { type: "message.delta", text: "hello" };
      expect(isMessageDeltaEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isMessageDeltaEvent({ type: "meta", sessionId: "s1" })).toBe(
        false,
      );
    });
  });

  describe("isThinkingDeltaEvent", () => {
    it("returns true for thinking.delta event", () => {
      const event: UiEvent = { type: "thinking.delta", text: "..." };
      expect(isThinkingDeltaEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isThinkingDeltaEvent({ type: "message.done" })).toBe(false);
    });
  });

  describe("isToolStartEvent", () => {
    it("returns true for tool.start event", () => {
      const event: UiEvent = {
        type: "tool.start",
        toolName: "search",
        input: { q: "x" },
      };
      expect(isToolStartEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(
        isToolStartEvent({ type: "tool.end", toolName: "x", output: {} }),
      ).toBe(false);
    });
  });

  describe("isToolEndEvent", () => {
    it("returns true for tool.end event", () => {
      const event: UiEvent = {
        type: "tool.end",
        toolName: "search",
        output: { result: "ok" },
      };
      expect(isToolEndEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(
        isToolEndEvent({ type: "tool.start", toolName: "x", input: {} }),
      ).toBe(false);
    });
  });

  describe("isMessageDoneEvent", () => {
    it("returns true for message.done event", () => {
      const event: UiEvent = { type: "message.done" };
      expect(isMessageDoneEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isMessageDoneEvent({ type: "run.start" })).toBe(false);
    });
  });

  describe("isErrorEvent", () => {
    it("returns true for error event", () => {
      const event: UiEvent = { type: "error", message: "failed" };
      expect(isErrorEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isErrorEvent({ type: "meta", sessionId: "s1" })).toBe(false);
    });
  });

  describe("isRunStartEvent", () => {
    it("returns true for run.start event", () => {
      const event: UiEvent = { type: "run.start" };
      expect(isRunStartEvent(event)).toBe(true);
    });
    it("returns false for other event types", () => {
      expect(isRunStartEvent({ type: "message.done" })).toBe(false);
    });
  });
});
