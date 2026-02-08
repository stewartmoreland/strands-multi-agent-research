import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./tabs";
import userEvent from "@testing-library/user-event";

describe("Tabs", () => {
  const renderTabs = (props = {}) => {
    return render(
      <Tabs defaultValue="tab1" {...props}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
  };

  it("renders correctly with default props", async () => {
    renderTabs();

    const tabsList = screen.getByRole("tablist");
    const tabTriggers = screen.getAllByRole("tab");
    const tabContents = screen.getAllByRole("tabpanel", { hidden: true });

    expect(tabsList).toBeInTheDocument();
    expect(tabTriggers).toHaveLength(2);
    expect(tabContents).toHaveLength(2);

    // First tab should be selected by default
    await waitFor(() => {
      expect(tabTriggers[0]).toHaveAttribute("data-state", "active");
      expect(tabTriggers[1]).toHaveAttribute("data-state", "inactive");
      expect(tabContents[0]).toHaveAttribute("data-state", "active");
      expect(tabContents[1]).toHaveAttribute("data-state", "inactive");
    });
  });

  it("handles tab changes", async () => {
    const user = userEvent.setup();
    renderTabs();

    const tabTriggers = screen.getAllByRole("tab");
    const tabContents = screen.getAllByRole("tabpanel", { hidden: true });

    // Click second tab
    const secondTab = tabTriggers[1];
    expect(secondTab).toBeDefined();
    await user.click(secondTab as HTMLElement);

    // Wait for state to update
    await waitFor(() => {
      expect(tabTriggers[0]).toHaveAttribute("data-state", "inactive");
      expect(tabTriggers[1]).toHaveAttribute("data-state", "active");
      expect(tabContents[0]).toHaveAttribute("data-state", "inactive");
      expect(tabContents[1]).toHaveAttribute("data-state", "active");
    });
  });

  it("applies custom className to all components", () => {
    render(
      <Tabs defaultValue="tab1" className="custom-tabs">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>
    );

    const tabs = screen.getByRole("tablist").parentElement;
    const list = screen.getByRole("tablist");
    const trigger = screen.getByRole("tab");
    const content = screen.getByRole("tabpanel");

    expect(tabs).toHaveClass("custom-tabs");
    expect(list).toHaveClass("custom-list");
    expect(trigger).toHaveClass("custom-trigger");
    expect(content).toHaveClass("custom-content");
  });

  it("handles disabled tabs", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tabTriggers = screen.getAllByRole("tab");
    expect(tabTriggers[1]).toHaveAttribute("data-disabled");
  });

  it("maintains selected tab when controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tabTriggers = screen.getAllByRole("tab");
    const tabContents = screen.getAllByRole("tabpanel", { hidden: true });

    // Click second tab
    const secondTab = tabTriggers[1];
    expect(secondTab).toBeDefined();
    await user.click(secondTab as HTMLElement);

    // Wait for onValueChange to be called
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith("tab2");
    });

    // Check that the state hasn't changed (controlled component)
    expect(tabTriggers[0]).toHaveAttribute("data-state", "active");
    expect(tabTriggers[1]).toHaveAttribute("data-state", "inactive");
    expect(tabContents[0]).toHaveAttribute("data-state", "active");
    expect(tabContents[1]).toHaveAttribute("data-state", "inactive");
  });

  it("renders with aria-label", () => {
    render(
      <Tabs defaultValue="tab1" aria-label="Custom tabs">
        <TabsList>
          <TabsTrigger value="tab1" aria-label="First tab">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    );

    const tabs = screen.getByLabelText("Custom tabs");
    const trigger = screen.getByLabelText("First tab");

    expect(tabs).toBeInTheDocument();
    expect(trigger).toBeInTheDocument();
  });
});
