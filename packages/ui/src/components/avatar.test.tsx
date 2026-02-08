import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

describe("Avatar", () => {
  it("renders correctly with default props", () => {
    render(<Avatar>Avatar</Avatar>);
    const avatar = screen.getByText("Avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("rounded-full");
  });

  it("applies custom className correctly", () => {
    render(<Avatar className="custom-avatar">Avatar</Avatar>);
    expect(screen.getByText("Avatar")).toHaveClass("custom-avatar");
  });

  // it("renders with image", () => {
  //   render(
  //     <Avatar>
  //       <AvatarImage src="/test.jpg" alt="Test Avatar" />
  //       <AvatarFallback>FB</AvatarFallback>
  //     </Avatar>
  //   );
  //   const image = screen.getByRole("img", { name: "Test Avatar" });
  //   expect(image).toBeInTheDocument();
  //   expect(image).toHaveAttribute("src", "/test.jpg");
  // });

  it("renders fallback when image fails to load", () => {
    render(
      <Avatar>
        <AvatarImage src="/test.jpg" alt="Test Avatar" />
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText("FB");
    expect(fallback).toBeInTheDocument();
  });

  // it("applies correct styles to AvatarImage", () => {
  //   render(
  //     <Avatar>
  //       <AvatarImage src="/test.jpg" alt="Test Avatar" />
  //       <AvatarFallback>FB</AvatarFallback>
  //     </Avatar>
  //   );
  //   const image = screen.getByRole("img", { name: "Test Avatar" });
  //   expect(image).toHaveClass("aspect-square");
  // });

  it("applies correct styles to AvatarFallback", () => {
    render(
      <Avatar>
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText("FB");
    expect(fallback).toHaveClass("flex items-center justify-center");
  });

  it("handles different sizes", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(
        <Avatar
          className={`size-${size === "sm" ? "8" : size === "md" ? "10" : "12"}`}
        >
          <AvatarFallback>FB</AvatarFallback>
        </Avatar>,
      );
      const avatar = screen.getByText("FB");
      expect(avatar.parentElement).toHaveClass(
        `size-${size === "sm" ? "8" : size === "md" ? "10" : "12"}`,
      );
      unmount();
    });
  });
});
