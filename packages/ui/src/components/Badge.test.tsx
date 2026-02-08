import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  const renderBadge = (props = {}) => {
    return render(<Badge {...props}>Badge Content</Badge>);
  };

  it("renders badge with content", () => {
    renderBadge();
    expect(screen.getByText("Badge Content")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    renderBadge();
    const badge = screen.getByText("Badge Content");
    expect(badge).toHaveClass("bg-primary");
  });

  it("applies custom variant styles", () => {
    renderBadge({ variant: "secondary" });
    const badge = screen.getByText("Badge Content");
    expect(badge).toHaveClass("bg-secondary");
  });

  it("applies custom className", () => {
    renderBadge({ className: "custom-badge" });
    const badge = screen.getByText("Badge Content");
    expect(badge).toHaveClass("custom-badge");
  });

  it("handles different variants", () => {
    const variants = [
      "default",
      "secondary",
      "destructive",
      "outline",
    ] as const;
    variants.forEach((variant) => {
      const { unmount } = renderBadge({ variant });
      const badge = screen.getByText("Badge Content");
      if (variant === "default") {
        expect(badge).toHaveClass("bg-primary");
      } else if (variant === "outline") {
        expect(badge).toHaveClass("border");
      } else {
        expect(badge).toHaveClass(`bg-${variant}`);
      }
      unmount();
    });
  });

  // it("handles different sizes", () => {
  //   const sizes = ["default", "sm", "lg"] as const;
  //   sizes.forEach((size) => {
  //     const { unmount } = renderBadge({ size });
  //     const badge = screen.getByText("Badge Content");
  //     if (size === "default") {
  //       expect(badge).toHaveClass("text-xs");
  //     } else if (size === "sm") {
  //       expect(badge).toHaveClass("text-xs px-2 py-0.5");
  //     } else {
  //       expect(badge).toHaveClass("text-sm px-2.5 py-0.5");
  //     }
  //     unmount();
  //   });
  // });

  it("combines variant and custom className", () => {
    renderBadge({ variant: "secondary", className: "custom-badge" });
    const badge = screen.getByText("Badge Content");
    expect(badge).toHaveClass("bg-secondary");
    expect(badge).toHaveClass("custom-badge");
  });
});
