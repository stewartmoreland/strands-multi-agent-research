import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <span>Card body</span>
      </Card>,
    );
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("has card data-slot", () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
  });

  it("CardHeader and CardTitle render", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
