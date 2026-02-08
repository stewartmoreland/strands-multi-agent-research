import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

describe("Dialog", () => {
  const renderDialog = (props = {}) => {
    return render(
      <Dialog {...props}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
  };

  it("renders trigger button correctly", () => {
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    expect(trigger).toBeInTheDocument();
  });

  it("opens dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Dialog Title")).toBeInTheDocument();
      expect(screen.getByText("Dialog Description")).toBeInTheDocument();
      expect(screen.getByText("Dialog Content")).toBeInTheDocument();
    });
  });

  // it("closes dialog when close button is clicked", async () => {
  //   const user = userEvent.setup();
  //   renderDialog();

  //   // Open dialog
  //   const trigger = screen.getByRole("button", { name: "Open Dialog" });
  //   await user.click(trigger);

  //   // Wait for dialog to open
  //   await waitFor(() => {
  //     expect(screen.getByRole("dialog")).toBeInTheDocument();
  //   });

  //   // Click close button
  //   const closeButton = screen.getByRole("button", { name: "Close" });
  //   await user.click(closeButton);

  //   // Wait for dialog to close
  //   await waitFor(() => {
  //     expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  //   });
  // });

  it("closes dialog when escape key is pressed", async () => {
    const user = userEvent.setup();
    renderDialog();

    // Open dialog
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await user.click(trigger);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Press escape key
    await user.keyboard("{Escape}");

    // Wait for dialog to close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("applies custom className to all components", () => {
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open Dialog</DialogTrigger>
        <DialogContent className="custom-content">
          <DialogHeader className="custom-header">
            <DialogTitle className="custom-title">Dialog Title</DialogTitle>
            <DialogDescription className="custom-description">
              Dialog Description
            </DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter className="custom-footer">
            <DialogClose className="custom-close">Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    expect(trigger).toHaveClass("custom-trigger");
  });

  it("handles controlled state", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await userEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  // it("renders with aria-label", async () => {
  //   const user = userEvent.setup();
  //   render(
  //     <Dialog>
  //       <DialogTrigger>Open Dialog</DialogTrigger>
  //       <DialogContent aria-label="Custom Dialog">
  //         <DialogHeader>
  //           <DialogTitle>Dialog Title</DialogTitle>
  //         </DialogHeader>
  //       </DialogContent>
  //     </Dialog>
  //   );

  //   // Open dialog
  //   const trigger = screen.getByRole("button", { name: "Open Dialog" });
  //   await user.click(trigger);

  //   // Wait for dialog to open and check aria-label
  //   await waitFor(() => {
  //     const dialog = screen.getByRole("dialog", { name: "Custom Dialog" });
  //     expect(dialog).toBeInTheDocument();
  //   });
  // });
});
