import { beforeEach, describe, expect, it } from "vitest";
import { memoryAdapter } from "./memoryAdapter";

describe("memoryAdapter (local fallback)", () => {
  beforeEach(() => {
    memoryAdapter.clearLocalStore();
  });

  it("logs conversation event and lists session", async () => {
    const actorId = "actor-1";
    const sessionId = "session-1";
    await memoryAdapter.logConversationEvent(
      actorId,
      sessionId,
      "user",
      "Hello",
    );
    const sessions = await memoryAdapter.listSessions(actorId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions.some((s) => s.sessionId === sessionId)).toBe(true);
  });

  it("lists events for session after logging", async () => {
    const actorId = "actor-2";
    const sessionId = "session-2";
    await memoryAdapter.logConversationEvent(
      actorId,
      sessionId,
      "user",
      "Test message",
    );
    const events = await memoryAdapter.listEvents(actorId, sessionId);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.some((e) => e.text?.includes("Test message"))).toBe(true);
  });

  it("clearLocalStore removes local data", async () => {
    const actorId = "actor-3";
    const sessionId = "session-3";
    await memoryAdapter.logConversationEvent(
      actorId,
      sessionId,
      "user",
      "To clear",
    );
    memoryAdapter.clearLocalStore();
    const sessions = await memoryAdapter.listSessions(actorId);
    expect(sessions).toHaveLength(0);
  });
});
