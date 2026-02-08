import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { listFoundationModels, memoryAdapter } from "@repo/util";
import app from "./app";

vi.mock("@repo/util", () => ({
  listFoundationModels: vi.fn(),
  memoryAdapter: {
    listSessions: vi.fn(),
    listEvents: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(memoryAdapter.listSessions).mockResolvedValue([]);
  vi.mocked(memoryAdapter.listEvents).mockResolvedValue([]);
  vi.mocked(listFoundationModels).mockResolvedValue([
    { modelId: "model-1", modelName: "Test Model" },
  ]);
});

describe("GET /models", () => {
  it("returns models", async () => {
    const res = await request(app).get("/models");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("models");
    expect(res.body.models).toHaveLength(1);
    expect(res.body.models[0].modelId).toBe("model-1");
  });
});

describe("GET /sessions", () => {
  it("returns 401 without Authorization", async () => {
    const res = await request(app).get("/sessions");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 for invalid token", async () => {
    const res = await request(app)
      .get("/sessions")
      .set("Authorization", "Bearer invalid.jwt.here");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("returns sessions with valid token", async () => {
    const payload = JSON.stringify({ sub: "actor-1" });
    const base64 = Buffer.from(payload, "utf-8").toString("base64");
    const token = `h.${base64}.s`;
    vi.mocked(memoryAdapter.listSessions).mockResolvedValue([
      {
        actorId: "actor-1",
        sessionId: "s1",
        createdAt: new Date("2025-01-01"),
      },
    ]);
    vi.mocked(memoryAdapter.listEvents).mockResolvedValue([]);
    const res = await request(app)
      .get("/sessions")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].id).toBe("s1");
  });
});

describe("GET /sessions/:sessionId/events", () => {
  it("returns 401 without Authorization", async () => {
    const res = await request(app).get("/sessions/s1/events");
    expect(res.status).toBe(401);
  });

  it("returns events with valid token", async () => {
    const payload = JSON.stringify({ sub: "actor-1" });
    const base64 = Buffer.from(payload, "utf-8").toString("base64");
    const token = `h.${base64}.s`;
    vi.mocked(memoryAdapter.listEvents).mockResolvedValue([
      {
        eventId: "e1",
        role: "USER",
        text: "Hello",
        eventTimestamp: new Date("2025-01-01"),
      },
    ]);
    const res = await request(app)
      .get("/sessions/s1/events")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].eventId).toBe("e1");
    expect(res.body.events[0].text).toBe("Hello");
  });
});
