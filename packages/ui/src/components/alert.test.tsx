import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  const renderAlert = (props = {}) => {
    return render(
      <Alert {...props}>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>,
    );
  };

  it("renders alert with title and description", () => {
    renderAlert();
    expect(screen.getByText("Alert Title")).toBeInTheDocument();
    expect(screen.getByText("Alert Description")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    renderAlert();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("bg-card");
  });

  it("applies custom variant styles", () => {
    renderAlert({ variant: "destructive" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-destructive");
  });

  it("applies custom className", () => {
    renderAlert({ className: "custom-alert" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("custom-alert");
  });

  it("renders without title", () => {
    render(
      <Alert>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>,
    );
    expect(screen.queryByText("Alert Title")).not.toBeInTheDocument();
    expect(screen.getByText("Alert Description")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
      </Alert>,
    );
    expect(screen.getByText("Alert Title")).toBeInTheDocument();
    expect(screen.queryByText("Alert Description")).not.toBeInTheDocument();
  });

  it("handles different variants", () => {
    const variants = ["default", "destructive"] as const;
    variants.forEach((variant) => {
      const { unmount } = renderAlert({ variant });
      const alert = screen.getByRole("alert");
      if (variant === "default") {
        expect(alert).toHaveClass("bg-card");
      } else {
        expect(alert).toHaveClass("text-destructive");
      }
      unmount();
    });
  });
});
