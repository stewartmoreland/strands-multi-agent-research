import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";

describe("Accordion", () => {
  const renderAccordion = (props = {}) => {
    return render(
      <Accordion type="multiple" {...props}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  it("renders all sections correctly", () => {
    renderAccordion();
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
  });

  it("expands section when clicked", async () => {
    const user = userEvent.setup();
    renderAccordion();

    const trigger = screen.getByText("Section 1");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  it("collapses section when clicked again", async () => {
    const user = userEvent.setup();
    renderAccordion();

    const trigger = screen.getByText("Section 1");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });

  it("handles multiple sections independently", async () => {
    const user = userEvent.setup();
    renderAccordion();

    const trigger1 = screen.getByText("Section 1");
    const trigger2 = screen.getByText("Section 2");

    await user.click(trigger1);
    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    await user.click(trigger2);
    await waitFor(() => {
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    // Both sections should be expanded
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  // it("applies custom className to content", () => {
  //   render(
  //     <Accordion type="multiple">
  //       <AccordionItem value="item-1">
  //         <AccordionTrigger>Section 1</AccordionTrigger>
  //         <AccordionContent className="custom-content">
  //           Content 1
  //         </AccordionContent>
  //       </AccordionItem>
  //     </Accordion>
  //   );

  //   const trigger = screen.getByText("Section 1");
  //   userEvent.click(trigger);

  //   const content = screen.getByText("Content 1");
  //   expect(content).toHaveClass("custom-content");
  // });

  it("handles controlled state", async () => {
    const onValueChange = vi.fn();
    render(
      <Accordion
        type="multiple"
        value={["item-1"]}
        onValueChange={onValueChange}
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByText("Section 1");
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith([]);
    });
  });

  it("handles type prop correctly", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByText("Section 1");
    const trigger2 = screen.getByText("Section 2");

    await user.click(trigger1);
    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    await user.click(trigger2);
    await waitFor(() => {
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });
});
