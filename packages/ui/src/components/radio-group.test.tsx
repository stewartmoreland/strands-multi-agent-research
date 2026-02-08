import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup, RadioGroupItem } from "./radio-group";

describe("RadioGroup", () => {
  it("renders correctly with default props", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>,
    );

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(2);
    expect(radioButtons[0]).not.toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();
  });

  it("handles value changes", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>,
    );

    const radioButtons = screen.getAllByRole("radio");
    fireEvent.click(radioButtons[0] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledWith("option1");
  });

  it("applies disabled state correctly", () => {
    render(
      <RadioGroup disabled>
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>,
    );

    const radioButtons = screen.getAllByRole("radio");
    radioButtons.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it("renders with custom className", () => {
    render(
      <RadioGroup className="custom-group-class">
        <RadioGroupItem value="option1" className="custom-item-class" />
      </RadioGroup>,
    );

    const group = screen.getByRole("radiogroup");
    const radio = screen.getByRole("radio");
    expect(group).toHaveClass("custom-group-class");
    expect(radio).toHaveClass("custom-item-class");
  });

  it("renders with aria-label", () => {
    render(
      <RadioGroup aria-label="Custom radio group">
        <RadioGroupItem value="option1" aria-label="Option 1" />
      </RadioGroup>,
    );

    const group = screen.getByLabelText("Custom radio group");
    const radio = screen.getByLabelText("Option 1");
    expect(group).toBeInTheDocument();
    expect(radio).toBeInTheDocument();
  });

  it("maintains single selection", () => {
    render(
      <RadioGroup defaultValue="option1">
        <RadioGroupItem value="option1" />
        <RadioGroupItem value="option2" />
      </RadioGroup>,
    );

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();

    fireEvent.click(radioButtons[1] as HTMLElement);
    expect(radioButtons[0]).not.toBeChecked();
    expect(radioButtons[1]).toBeChecked();
  });
});
