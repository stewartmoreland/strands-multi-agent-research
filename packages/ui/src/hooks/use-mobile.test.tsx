import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  const listeners: Array<() => void> = [];
  const mockMatchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, fn: () => void) => {
      listeners.push(fn);
    },
    removeEventListener: (_: string, fn: () => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
    dispatchEvent: vi.fn(),
  }));

  beforeEach(() => {
    listeners.length = 0;
    vi.stubGlobal("matchMedia", mockMatchMedia);
  });

  it("returns boolean", () => {
    vi.stubGlobal("innerWidth", 800);
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });

  it("returns true when innerWidth < 768", () => {
    vi.stubGlobal("innerWidth", 767);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when innerWidth >= 768", () => {
    vi.stubGlobal("innerWidth", 768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
