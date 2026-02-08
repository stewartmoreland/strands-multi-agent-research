import { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { getActorIdFromAuth, parseBody, sendEvent } from "./serverHelpers";

function createMockRequest(
  overrides: Partial<{
    headers: Record<string, string>;
    body: string;
  }> = {},
): IncomingMessage {
  const { headers = {}, body = "" } = overrides;
  const chunks = body ? [Buffer.from(body)] : [];
  const req = {
    headers: { ...headers },
    on(event: string, fn: (...args: unknown[]) => void) {
      if (event === "data" && chunks.length) {
        chunks.forEach((c) => fn(c));
      }
      if (event === "end") setTimeout(() => fn(), 0);
      return this;
    },
  } as unknown as IncomingMessage;
  return req;
}

describe("getActorIdFromAuth", () => {
  it("returns null when no Authorization header", () => {
    const req = createMockRequest();
    expect(getActorIdFromAuth(req)).toBeNull();
  });

  it("returns null when Authorization does not start with Bearer", () => {
    const req = createMockRequest({ headers: { authorization: "Basic x" } });
    expect(getActorIdFromAuth(req)).toBeNull();
  });

  it("returns null for malformed JWT (not 3 parts)", () => {
    const req = createMockRequest({
      headers: { authorization: "Bearer a.b" },
    });
    expect(getActorIdFromAuth(req)).toBeNull();
  });

  it("returns sub from valid JWT payload", () => {
    const payload = JSON.stringify({ sub: "user-123" });
    const base64 = Buffer.from(payload, "utf-8").toString("base64");
    const token = `header.${base64}.sig`;
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getActorIdFromAuth(req)).toBe("user-123");
  });

  it("returns null when sub is not a string", () => {
    const payload = JSON.stringify({ sub: 123 });
    const base64 = Buffer.from(payload, "utf-8").toString("base64");
    const token = `header.${base64}.sig`;
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getActorIdFromAuth(req)).toBeNull();
  });
});

describe("parseBody", () => {
  it("parses JSON body", async () => {
    const req = createMockRequest({ body: '{"a":1}' });
    const result = await parseBody<{ a: number }>(req);
    expect(result).toEqual({ a: 1 });
  });

  it("rejects invalid JSON", async () => {
    const req = createMockRequest({ body: "not json" });
    await expect(parseBody(req)).rejects.toThrow("Invalid JSON body");
  });
});

describe("sendEvent", () => {
  it("writes SSE-formatted line", () => {
    const chunks: string[] = [];
    const res = {
      write(data: string) {
        chunks.push(data);
        return true;
      },
    } as unknown as import("node:http").ServerResponse;
    sendEvent(res, { type: "meta", sessionId: "s1" });
    expect(chunks.join("")).toBe('data: {"type":"meta","sessionId":"s1"}\n\n');
  });
});
