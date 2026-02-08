import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

describe("NavigationMenu", () => {
  it("renders correctly with default props", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Content 1</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("applies custom className correctly", () => {
    render(
      <NavigationMenu className="custom-menu">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByRole("navigation")).toHaveClass("custom-menu");
  });

  it("handles menu item click", () => {
    const handleClick = vi.fn();
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger onClick={handleClick}>
              Item 1
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    fireEvent.click(screen.getByText("Item 1"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("renders multiple menu items", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 2</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders menu content when trigger is clicked", async () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Content 1</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    fireEvent.click(screen.getByText("Item 1"));

    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  it("applies correct styles to NavigationMenuList", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByRole("list")).toHaveClass("flex");
  });

  it("applies correct styles to NavigationMenuItem", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByText("Item 1").parentElement).toHaveClass("relative");
  });

  it("applies correct styles to NavigationMenuTrigger", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );

    expect(screen.getByText("Item 1")).toHaveClass("group");
  });

  // it("applies correct styles to NavigationMenuContent", async () => {
  //   render(
  //     <NavigationMenu>
  //       <NavigationMenuList>
  //         <NavigationMenuItem>
  //           <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
  //           <NavigationMenuContent>
  //             <NavigationMenuLink>Content 1</NavigationMenuLink>
  //           </NavigationMenuContent>
  //         </NavigationMenuItem>
  //       </NavigationMenuList>
  //     </NavigationMenu>
  //   );

  //   fireEvent.click(screen.getByText("Item 1"));

  //   await waitFor(() => {
  //     expect(screen.getByText("Content 1").parentElement).toHaveClass(
  //       "absolute"
  //     );
  //   });
  // });
});
