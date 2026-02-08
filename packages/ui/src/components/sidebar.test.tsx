import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from "./sidebar";

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Sidebar", () => {
  it("renders correctly with default props", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Header</SidebarHeader>
          <SidebarContent>Content</SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  // it("applies custom className correctly", () => {
  //   render(
  //     <SidebarProvider>
  //       <Sidebar className="custom-sidebar">
  //         <SidebarContent>Content</SidebarContent>
  //       </Sidebar>
  //     </SidebarProvider>
  //   );

  //   expect(screen.getByRole("complementary")).toHaveClass("custom-sidebar");
  // });

  // it("toggles sidebar visibility when trigger is clicked", () => {
  //   render(
  //     <SidebarProvider>
  //       <Sidebar>
  //         <SidebarContent>Content</SidebarContent>
  //       </Sidebar>
  //       <SidebarTrigger />
  //     </SidebarProvider>
  //   );

  //   const trigger = screen.getByRole("button");
  //   fireEvent.click(trigger);

  //   // The sidebar should have a class indicating its collapsed state
  //   expect(screen.getByRole("complementary")).toHaveAttribute(
  //     "data-collapsed",
  //     "true"
  //   );
  // });

  it("renders sidebar groups", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>Group 1</SidebarGroup>
            <SidebarGroup>Group 2</SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(screen.getByText("Group 2")).toBeInTheDocument();
  });

  // it("applies correct styles to SidebarHeader", () => {
  //   render(
  //     <Sidebar>
  //       <SidebarHeader>Header</SidebarHeader>
  //     </Sidebar>
  //   );

  //   const header = screen.getByText("Header").parentElement;
  //   expect(header).toHaveClass("sticky");
  //   expect(header).toHaveClass("top-0");
  // });

  // it("applies correct styles to SidebarContent", () => {
  //   render(
  //     <Sidebar>
  //       <SidebarContent>Content</SidebarContent>
  //     </Sidebar>
  //   );

  //   const content = screen.getByText("Content").parentElement;
  //   expect(content).toHaveClass("flex-1");
  //   expect(content).toHaveClass("overflow-auto");
  // });

  // it("applies correct styles to SidebarFooter", () => {
  //   render(
  //     <Sidebar>
  //       <SidebarFooter>Footer</SidebarFooter>
  //     </Sidebar>
  //   );

  //   const footer = screen.getByText("Footer").parentElement;
  //   expect(footer).toHaveClass("sticky");
  //   expect(footer).toHaveClass("bottom-0");
  // });

  // it("applies correct styles to SidebarGroup", () => {
  //   render(
  //     <SidebarProvider>
  //       <Sidebar>
  //         <SidebarContent>
  //           <SidebarGroup>Group</SidebarGroup>
  //         </SidebarContent>
  //       </Sidebar>
  //     </SidebarProvider>
  //   );

  //   expect(screen.getByText("Group").parentElement).toHaveClass("space-y-1");
  // });

  // it("handles collapsible sidebar states", () => {
  //   render(
  //     <SidebarProvider>
  //       <Sidebar collapsible="icon">
  //         <SidebarContent>Content</SidebarContent>
  //       </Sidebar>
  //     </SidebarProvider>
  //   );

  //   expect(
  //     screen.getByText("Content").parentElement?.parentElement
  //   ).toHaveAttribute("data-collapsible", "icon");
  // });

  // it("applies correct styles based on side prop", () => {
  //   render(
  //     <SidebarProvider>
  //       <Sidebar side="right">
  //         <SidebarContent>Content</SidebarContent>
  //       </Sidebar>
  //     </SidebarProvider>
  //   );

  //   expect(
  //     screen.getByText("Content").parentElement?.parentElement
  //   ).toHaveAttribute("data-side", "right");
  // });

  // it("applies correct styles based on variant prop", () => {
  //   render(
  //     <Sidebar variant="floating">
  //       <SidebarContent>Content</SidebarContent>
  //     </Sidebar>
  //   );

  //   expect(
  //     screen.getByText("Content").parentElement?.parentElement
  //   ).toHaveAttribute("data-variant", "floating");
  // });
});
