import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./input-otp";

// Global setup is applied via vitest.config.ts setupFiles

describe("InputOTP", () => {
  // it("renders with default props", () => {
  //   render(
  //     <InputOTP maxLength={4}>
  //       <InputOTPGroup>
  //         <InputOTPSlot index={0} />
  //         <InputOTPSlot index={1} />
  //         <InputOTPSlot index={2} />
  //         <InputOTPSlot index={3} />
  //       </InputOTPGroup>
  //     </InputOTP>
  //   );

  //   const container = screen.getByTestId("input-otp-container");
  //   const containerClasses = container.getAttribute("class")?.split(" ") || [];

  //   // Check container classes
  //   expect(containerClasses).toContain("flex");
  //   expect(containerClasses).toContain("items-center");
  //   expect(containerClasses).toContain("gap-2");
  //   expect(containerClasses).toContain("has-disabled:opacity-50");
  // });

  // it("applies custom container className", () => {
  //   render(
  //     <InputOTP maxLength={4} containerClassName="custom-container">
  //       <InputOTPGroup>
  //         <InputOTPSlot index={0} />
  //         <InputOTPSlot index={1} />
  //         <InputOTPSlot index={2} />
  //         <InputOTPSlot index={3} />
  //       </InputOTPGroup>
  //     </InputOTP>
  //   );

  //   const container = screen.getByTestId("input-otp-container");
  //   expect(container).toHaveClass("custom-container");
  // });

  it("applies custom className to input group", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup className="custom-group">
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    );

    const group = container.querySelector('[data-slot="input-otp-group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass("custom-group");
  });

  it("handles disabled state", () => {
    render(
      <InputOTP maxLength={4} disabled>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("renders correct number of input slots", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    );

    const slots = container.querySelectorAll('[data-slot="input-otp-slot"]');
    expect(slots).toHaveLength(4);
  });

  // it("handles input focus and navigation", async () => {
  //   const user = userEvent.setup();

  //   render(
  //     <InputOTP maxLength={4}>
  //       <InputOTPGroup>
  //         <InputOTPSlot index={0} />
  //         <InputOTPSlot index={1} />
  //         <InputOTPSlot index={2} />
  //         <InputOTPSlot index={3} />
  //       </InputOTPGroup>
  //     </InputOTP>
  //   );

  //   const input = screen.getByRole("textbox");
  //   expect(input).toBeInTheDocument();

  //   await user.click(input);
  //   await user.keyboard("1");

  //   // Check if the value is set
  //   expect(input).toHaveValue("1");
  // });

  it("maintains input group structure", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    );

    const group = container.querySelector('[data-slot="input-otp-group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("data-slot", "input-otp-group");
    expect(group).toHaveClass("flex");
    expect(group).toHaveClass("items-center");
  });

  // it("handles complete input sequence", async () => {
  //   const user = userEvent.setup();

  //   render(
  //     <InputOTP maxLength={4}>
  //       <InputOTPGroup>
  //         <InputOTPSlot index={0} />
  //         <InputOTPSlot index={1} />
  //         <InputOTPSlot index={2} />
  //         <InputOTPSlot index={3} />
  //       </InputOTPGroup>
  //     </InputOTP>
  //   );

  //   const input = screen.getByRole("textbox");
  //   expect(input).toBeInTheDocument();

  //   await user.click(input);
  //   await user.keyboard("1234");

  //   expect(input).toHaveValue("1234");
  // });
});
