import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

describe('Tooltip', () => {
  // Setup default delay duration for all tests
  const renderTooltip = (props = {}) => {
    return render(
      <TooltipProvider delayDuration={0}>
        <Tooltip {...props}>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
  }

  it('renders trigger button correctly', () => {
    renderTooltip()
    const trigger = screen.getByRole('button', { name: 'Hover me' })
    expect(trigger).toBeInTheDocument()
  })

  // it("shows tooltip on hover", async () => {
  //   const user = userEvent.setup();
  //   renderTooltip();

  //   const trigger = screen.getByRole("button", { name: "Hover me" });
  //   await user.hover(trigger);

  //   // Wait for tooltip to appear in the portal
  //   await waitFor(
  //     () => {
  //       const tooltip = screen.getByText("Tooltip content");
  //       expect(tooltip).toBeInTheDocument();
  //       expect(tooltip.closest("[data-state]")).toHaveAttribute(
  //         "data-state",
  //         "open"
  //       );
  //     },
  //     { timeout: 1000 }
  //   );
  // });

  // it("hides tooltip on mouse leave", async () => {
  //   const user = userEvent.setup();
  //   renderTooltip();

  //   const trigger = screen.getByRole("button", { name: "Hover me" });
  //   await user.hover(trigger);

  //   // Wait for tooltip to appear
  //   await waitFor(
  //     () => {
  //       expect(screen.getByText("Tooltip content")).toBeInTheDocument();
  //     },
  //     { timeout: 1000 }
  //   );

  //   await user.unhover(trigger);

  //   // Wait for tooltip to disappear
  //   await waitFor(
  //     () => {
  //       const tooltip = screen.queryByText("Tooltip content");
  //       expect(tooltip).not.toBeInTheDocument();
  //     },
  //     { timeout: 1000 }
  //   );
  // });

  // it("applies custom className to all components", () => {
  //   render(
  //     <TooltipProvider delayDuration={0}>
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <Button className="custom-trigger">Hover me</Button>
  //         </TooltipTrigger>
  //         <TooltipContent className="custom-content">
  //           Tooltip content
  //         </TooltipContent>
  //       </Tooltip>
  //     </TooltipProvider>
  //   );

  //   const trigger = screen.getByRole("button", { name: "Hover me" });
  //   expect(trigger).toHaveClass("custom-trigger");
  // });

  it('handles controlled state', async () => {
    const onOpenChange = vi.fn()
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip open={false} onOpenChange={onOpenChange}>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    const trigger = screen.getByRole('button', { name: 'Hover me' })
    await userEvent.hover(trigger)

    // Wait for tooltip to appear and check callback
    await waitFor(
      () => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      },
      { timeout: 1000 },
    )
  })

  // it("handles different positions", async () => {
  //   const user = userEvent.setup();
  //   render(
  //     <TooltipProvider delayDuration={0}>
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <Button>Hover me</Button>
  //         </TooltipTrigger>
  //         <TooltipContent side="top">Top tooltip</TooltipContent>
  //       </Tooltip>
  //     </TooltipProvider>
  //   );

  //   const trigger = screen.getByRole("button", { name: "Hover me" });
  //   await user.hover(trigger);

  //   await waitFor(
  //     () => {
  //       const content = screen.getByText("Top tooltip");
  //       expect(content).toBeInTheDocument();
  //       expect(content.closest("[data-side]")).toHaveAttribute(
  //         "data-side",
  //         "top"
  //       );
  //     },
  //     { timeout: 1000 }
  //   );
  // });

  // it("handles delay duration", async () => {
  //   const user = userEvent.setup();
  //   render(
  //     <TooltipProvider delayDuration={500}>
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <Button>Hover me</Button>
  //         </TooltipTrigger>
  //         <TooltipContent>Tooltip content</TooltipContent>
  //       </Tooltip>
  //     </TooltipProvider>
  //   );

  //   const trigger = screen.getByRole("button", { name: "Hover me" });
  //   await user.hover(trigger);

  //   // Tooltip should not be visible immediately
  //   expect(screen.queryByText("Tooltip content")).not.toBeInTheDocument();

  //   // Wait for delay duration plus some buffer
  //   await waitFor(
  //     () => {
  //       expect(screen.getByText("Tooltip content")).toBeInTheDocument();
  //     },
  //     { timeout: 1000 }
  //   );
  // });
})
