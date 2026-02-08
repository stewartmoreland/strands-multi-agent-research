import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  it("renders label with correct text", () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("applies correct base styles", () => {
    render(<Label>Test Label</Label>);
    const label = screen.getByText("Test Label");

    expect(label).toHaveAttribute("data-slot", "label");
    expect(label).toHaveClass("flex");
    expect(label).toHaveClass("items-center");
    expect(label).toHaveClass("gap-2");
    expect(label).toHaveClass("text-sm");
    expect(label).toHaveClass("leading-none");
    expect(label).toHaveClass("font-medium");
    expect(label).toHaveClass("select-none");
  });

  it("applies custom className", () => {
    render(<Label className="custom-class">Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toHaveClass("custom-class");
  });

  it("forwards htmlFor attribute", () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("handles disabled state through group data attribute", () => {
    render(
      <div data-disabled="true">
        <Label>Test Label</Label>
      </div>,
    );

    const label = screen.getByText("Test Label");
    expect(label).toHaveClass("group-data-[disabled=true]:pointer-events-none");
    expect(label).toHaveClass("group-data-[disabled=true]:opacity-50");
  });

  it("handles peer disabled state", () => {
    render(
      <div>
        <input disabled />
        <Label>Test Label</Label>
      </div>,
    );

    const label = screen.getByText("Test Label");
    expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
    expect(label).toHaveClass("peer-disabled:opacity-50");
  });
});
