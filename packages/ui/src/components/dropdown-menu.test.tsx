import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  const renderDropdownMenu = (props = {}) => {
    return render(
      <DropdownMenu {...props}>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem>Subscription</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
  };

  it("renders trigger button correctly", () => {
    renderDropdownMenu();
    const trigger = screen.getByRole("button", { name: "Open Menu" });
    expect(trigger).toBeInTheDocument();
  });

  it("opens menu when trigger is clicked", async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("My Account")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });
  });

  it("closes menu when escape key is pressed", async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    // Open menu
    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    // Press escape key
    await user.keyboard("{Escape}");

    // Wait for menu to close
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("handles checkbox items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>
            Show Status Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Show Activity Bar</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    const checkboxItems = screen.getAllByRole("menuitemcheckbox");
    expect(checkboxItems).toHaveLength(2);
    expect(checkboxItems[0]).toHaveAttribute("data-state", "checked");
  });

  it("handles radio items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="pedro">
            <DropdownMenuRadioItem value="pedro">Pedro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="colm">Colm</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    const radioItems = screen.getAllByRole("menuitemradio");
    expect(radioItems).toHaveLength(2);
    expect(radioItems[0]).toHaveAttribute("data-state", "checked");
  });

  it("handles submenus", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Save Page As...</DropdownMenuItem>
                <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    const subTrigger = screen.getByRole("menuitem", { name: "More Tools" });
    await user.click(subTrigger);

    await waitFor(() => {
      expect(screen.getByText("Save Page As...")).toBeInTheDocument();
      expect(screen.getByText("Create Shortcut...")).toBeInTheDocument();
    });
  });

  it("applies custom className to all components", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger className="custom-trigger">
          Open Menu
        </DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem className="custom-item">Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    expect(trigger).toHaveClass("custom-trigger");
  });

  it("handles controlled state", async () => {
    const onOpenChange = vi.fn();
    render(
      <DropdownMenu open={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await userEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("handles disabled items", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          <DropdownMenuItem>Enabled Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    const disabledItem = screen.getByRole("menuitem", {
      name: "Disabled Item",
    });
    expect(disabledItem).toHaveAttribute("data-disabled");
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First Item</DropdownMenuItem>
          <DropdownMenuItem>Second Item</DropdownMenuItem>
          <DropdownMenuItem>Third Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Open Menu" });
    await user.click(trigger);

    // Press arrow down to move to first item
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "First Item" })).toHaveFocus();

    // Press arrow down again to move to second item
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Second Item" })).toHaveFocus();

    // Press arrow up to move back to first item
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "First Item" })).toHaveFocus();
  });

  it("handles controlled state with defaultOpen", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
