import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex items-center justify-center");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant classes correctly", () => {
    render(<Button variant="destructive">Click me</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");
  });

  it("applies size classes correctly", () => {
    render(<Button size="lg">Click me</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");
  });

  it("applies disabled state correctly", () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("applies full width correctly", () => {
    render(<Button className="w-full">Click me</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("applies custom className correctly", () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("inline-flex items-center justify-center");
  });
});
