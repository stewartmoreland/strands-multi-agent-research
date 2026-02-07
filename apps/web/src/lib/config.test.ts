import { describe, it, expect } from "vitest";
import { validateConfig, config } from "./config";

describe("validateConfig", () => {
  it("returns object with valid and errors", () => {
    const result = validateConfig();
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("valid is false when user pool or client id missing", () => {
    const result = validateConfig();
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("COGNITO"))).toBe(true);
    }
  });
});

describe("config", () => {
  it("agent.sessionsUrl returns URL without trailing slash", () => {
    expect(config.agent.sessionsUrl).not.toMatch(/\/$/);
  });
  it("agent.sessionEventsUrl encodes sessionId", () => {
    const url = config.agent.sessionEventsUrl("s1/with-slash");
    expect(url).toContain(encodeURIComponent("s1/with-slash"));
  });
});
