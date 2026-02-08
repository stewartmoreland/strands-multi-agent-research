import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { Toaster } from "./sonner";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Toast", () => {
  const renderToast = () => {
    return render(
      <>
        <Toaster />
        <button onClick={() => toast("Test Toast")}>Show Toast</button>
      </>,
    );
  };

  it("renders toaster component", () => {
    renderToast();
    expect(
      screen.getByRole("button", { name: "Show Toast" }),
    ).toBeInTheDocument();
  });

  it("shows toast when triggered", async () => {
    const user = userEvent.setup();
    renderToast();

    const trigger = screen.getByRole("button", { name: "Show Toast" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Test Toast")).toBeInTheDocument();
    });
  });

  it("shows toast with different variants", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <button onClick={() => toast.success("Success Toast")}>
          Show Success
        </button>
        <button onClick={() => toast.error("Error Toast")}>Show Error</button>
        <button onClick={() => toast.warning("Warning Toast")}>
          Show Warning
        </button>
      </>,
    );

    const successButton = screen.getByRole("button", { name: "Show Success" });
    const errorButton = screen.getByRole("button", { name: "Show Error" });
    const warningButton = screen.getByRole("button", { name: "Show Warning" });

    await user.click(successButton);
    await waitFor(() => {
      expect(screen.getByText("Success Toast")).toBeInTheDocument();
    });

    await user.click(errorButton);
    await waitFor(() => {
      expect(screen.getByText("Error Toast")).toBeInTheDocument();
    });

    await user.click(warningButton);
    await waitFor(() => {
      expect(screen.getByText("Warning Toast")).toBeInTheDocument();
    });
  });

  it("shows toast with custom duration", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <button onClick={() => toast("Custom Duration", { duration: 5000 })}>
          Show Custom Duration
        </button>
      </>,
    );

    const trigger = screen.getByRole("button", {
      name: "Show Custom Duration",
    });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Custom Duration")).toBeInTheDocument();
    });
  });

  it("shows toast with custom position", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster position="top-left" />
        <button onClick={() => toast("Top Left Toast")}>Show Top Left</button>
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Show Top Left" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Top Left Toast")).toBeInTheDocument();
    });
  });

  it("shows toast with custom className", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster className="custom-toaster" />
        <button onClick={() => toast("Custom Class Toast")}>
          Show Custom Class
        </button>
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Show Custom Class" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Custom Class Toast")).toBeInTheDocument();
    });
  });

  it("shows toast with custom theme", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster theme="dark" />
        <button onClick={() => toast("Dark Theme Toast")}>
          Show Dark Theme
        </button>
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Show Dark Theme" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Dark Theme Toast")).toBeInTheDocument();
    });
  });
});
