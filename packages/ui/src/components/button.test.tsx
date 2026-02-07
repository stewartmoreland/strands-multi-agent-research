import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders with children", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders with default variant and size attributes", () => {
    const { getByRole } = render(<Button>Submit</Button>);
    const btn = getByRole("button", { name: /submit/i });
    expect(btn).toHaveAttribute("data-variant", "default");
    expect(btn).toHaveAttribute("data-size", "default");
  });

  it("applies variant and size", () => {
    const { getByRole } = render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    );
    const btn = getByRole("button", { name: /delete/i });
    expect(btn).toHaveAttribute("data-variant", "destructive");
    expect(btn).toHaveAttribute("data-size", "lg");
  });

  it("forwards disabled", () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole("button", { name: /disabled/i })).toBeDisabled();
  });
});
