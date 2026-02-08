import { describe, expect, it } from "vitest";
import { getGravatarUrl } from "./gravatar";

describe("getGravatarUrl", () => {
  it("returns URL with hash and default size", () => {
    const url = getGravatarUrl("test@example.com");
    expect(url).toMatch(
      /^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{32}\?d=identicon&s=80$/,
    );
  });

  it("uses custom size", () => {
    const url = getGravatarUrl("user@test.com", 120);
    expect(url).toContain("s=120");
  });

  it("normalizes email to lowercase", () => {
    const url1 = getGravatarUrl("User@Example.COM");
    const url2 = getGravatarUrl("user@example.com");
    expect(url1).toBe(url2);
  });
});
