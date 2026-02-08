import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

describe("Popover", () => {
  const renderPopover = (props = {}) => {
    return render(
      <Popover {...props}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>,
    );
  };

  it("renders trigger", () => {
    renderPopover();
    expect(screen.getByText("Open Popover")).toBeInTheDocument();
  });

  it("shows content when trigger is clicked", async () => {
    const user = userEvent.setup();
    renderPopover();

    const trigger = screen.getByText("Open Popover");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Popover Content")).toBeInTheDocument();
    });
  });

  it("applies default styles to content", async () => {
    const user = userEvent.setup();
    renderPopover();

    const trigger = screen.getByText("Open Popover");
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByText("Popover Content");
      expect(content).toHaveClass("bg-popover");
    });
  });

  // it("applies custom className to content", async () => {
  //   const user = userEvent.setup();
  //   renderPopover({ className: "custom-popover" });

  //   const trigger = screen.getByText("Open Popover");
  //   await user.click(trigger);

  //   await waitFor(() => {
  //     const content = screen.getByText("Popover Content");
  //     expect(content).toHaveClass("custom-popover");
  //   });
  // });

  // it("handles different alignments", async () => {
  //   const user = userEvent.setup();
  //   const alignments = ["start", "center", "end"] as const;

  //   for (const align of alignments) {
  //     const { unmount } = renderPopover({ align });
  //     const trigger = screen.getByText("Open Popover");
  //     await user.click(trigger);

  //     await waitFor(() => {
  //       const content = screen.getByText("Popover Content");
  //       expect(content).toHaveAttribute("data-align", align);
  //     });
  //     unmount();
  //   }
  // });

  // it("handles different sides", async () => {
  //   const user = userEvent.setup();
  //   const sides = ["top", "right", "bottom", "left"] as const;

  //   for (const side of sides) {
  //     const { unmount } = renderPopover({ side });
  //     const trigger = screen.getByText("Open Popover");
  //     await user.click(trigger);

  //     await waitFor(() => {
  //       const content = screen.getByText("Popover Content");
  //       expect(content).toHaveAttribute("data-side", side);
  //     });
  //     unmount();
  //   }
  // });

  // it("handles different alignments and sides", async () => {
  //   const user = userEvent.setup();
  //   const { unmount } = renderPopover({ align: "start", side: "top" });

  //   const trigger = screen.getByText("Open Popover");
  //   await user.click(trigger);

  //   await waitFor(() => {
  //     const content = screen.getByText("Popover Content");
  //     expect(content).toHaveAttribute("data-align", "start");
  //     expect(content).toHaveAttribute("data-side", "top");
  //   });
  //   unmount();
  // });

  it("closes popover when clicking outside", async () => {
    const user = userEvent.setup();
    renderPopover();

    // Open popover
    const trigger = screen.getByText("Open Popover");
    await user.click(trigger);

    // Wait for popover to open
    await waitFor(() => {
      expect(screen.getByText("Popover Content")).toBeInTheDocument();
    });

    // Click outside
    await user.click(document.body);

    // Wait for popover to close
    await waitFor(() => {
      expect(screen.queryByText("Popover Content")).not.toBeInTheDocument();
    });
  });

  it("handles controlled state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover open={false} onOpenChange={onOpenChange}>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open Popover");
    await user.click(trigger);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it("handles anchor positioning", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverAnchor>
          <div>Anchor element</div>
        </PopoverAnchor>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByText("Open Popover");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Anchor element")).toBeInTheDocument();
      expect(screen.getByText("Popover Content")).toBeInTheDocument();
    });
  });
});
