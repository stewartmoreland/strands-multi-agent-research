import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges single class", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles array of classes", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("tailwind-merge: later class overrides conflicting earlier", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});
