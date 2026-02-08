import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "./menubar";

describe("Menubar", () => {
  it("renders correctly with default props", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("applies custom className correctly", () => {
    render(
      <Menubar className="custom-menubar">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    );

    expect(screen.getByRole("menubar")).toHaveClass("custom-menubar");
  });

  // it("handles menu item click", async () => {
  //   const handleClick = jest.fn();
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem onClick={handleClick}>New</MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     const newItem = screen.getByText("New");
  //     expect(newItem).toBeInTheDocument();
  //     fireEvent.click(newItem);
  //     expect(handleClick).toHaveBeenCalled();
  //   });
  // });

  // it("renders multiple menu items", async () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem>New</MenubarItem>
  //           <MenubarItem>Open</MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     expect(screen.getByText("New")).toBeInTheDocument();
  //     expect(screen.getByText("Open")).toBeInTheDocument();
  //   });
  // });

  // it("renders menu content when trigger is clicked", async () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem>New</MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     expect(screen.getByText("New")).toBeInTheDocument();
  //   });
  // });

  // it("applies correct styles to MenubarMenu", () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   expect(screen.getByText("File").parentElement).toHaveClass("relative");
  // });

  it("applies correct styles to MenubarTrigger", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    );

    expect(screen.getByText("File")).toHaveClass("flex");
  });

  // it("applies correct styles to MenubarContent", async () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem>New</MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     expect(screen.getByText("New").parentElement).toHaveClass("absolute");
  //   });
  // });

  // it("renders shortcut in menu item", async () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem>
  //             New
  //             <MenubarShortcut>⌘N</MenubarShortcut>
  //           </MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     expect(screen.getByText("⌘N")).toBeInTheDocument();
  //   });
  // });

  // it("renders separator between menu items", async () => {
  //   render(
  //     <Menubar>
  //       <MenubarMenu>
  //         <MenubarTrigger>File</MenubarTrigger>
  //         <MenubarContent>
  //           <MenubarItem>New</MenubarItem>
  //           <MenubarSeparator />
  //           <MenubarItem>Exit</MenubarItem>
  //         </MenubarContent>
  //       </MenubarMenu>
  //     </Menubar>
  //   );

  //   fireEvent.click(screen.getByText("File"));

  //   await waitFor(() => {
  //     expect(screen.getByRole("separator")).toBeInTheDocument();
  //   });
  // });
});
