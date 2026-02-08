import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders correctly with default props", () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText("Card content");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("bg-card");
  });

  it("applies custom className correctly", () => {
    render(<Card className="custom-card">Card content</Card>);
    expect(screen.getByText("Card content")).toHaveClass("custom-card");
  });

  it("renders with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
    expect(screen.getByText("Card Footer")).toBeInTheDocument();
  });

  it("applies correct styles to CardHeader", () => {
    render(
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>,
    );
    const header = screen.getByText("Title").parentElement;
    expect(header).toHaveClass("px-6");
  });

  it("applies correct styles to CardTitle", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toHaveClass("font-semibold");
  });

  it("applies correct styles to CardDescription", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toHaveClass(
      "text-muted-foreground",
    );
  });

  it("applies correct styles to CardContent", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toHaveClass("px-6");
  });

  it("applies correct styles to CardFooter", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toHaveClass("px-6");
  });

  it("applies correct styles to CardAction", () => {
    render(
      <CardHeader>
        <CardAction>Action</CardAction>
      </CardHeader>,
    );
    expect(screen.getByText("Action")).toHaveClass("justify-self-end");
  });

  it("handles border styles correctly", () => {
    render(
      <Card>
        <CardHeader className="border-b">Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter className="border-t">Footer</CardFooter>
      </Card>,
    );

    const header = screen.getByText("Header");
    const footer = screen.getByText("Footer");

    expect(header).toHaveClass("border-b");
    expect(footer).toHaveClass("border-t");
  });
});
