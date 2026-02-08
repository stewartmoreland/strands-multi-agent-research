import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";
import { Input } from "./input";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

describe("Form", () => {
  const TestForm = () => {
    const form = useForm({
      defaultValues: {
        username: "",
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter your username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  };

  const TestFormWithValidation = () => {
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      mode: "onBlur",
      defaultValues: {
        username: "",
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => {})}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  };

  it("renders form elements correctly", () => {
    render(<TestForm />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByText("Enter your username")).toBeInTheDocument();
  });

  it("applies correct styling to form elements", () => {
    render(<TestForm />);

    const input = screen.getByLabelText("Username");
    const description = screen.getByText("Enter your username");

    expect(input).toHaveAttribute("data-slot", "form-control");
    expect(description).toHaveClass("text-muted-foreground");
    expect(description).toHaveClass("text-sm");
  });

  it("handles form validation", async () => {
    const user = userEvent.setup();
    render(<TestFormWithValidation />);

    const input = screen.getByLabelText("Username");
    await user.type(input, "a");
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 2 characters.")
      ).toBeInTheDocument();
    });
  });

  // it("updates form control aria attributes on error", async () => {
  //   const user = userEvent.setup();
  //   render(<TestFormWithValidation />);

  //   const input = screen.getByLabelText("Username");
  //   await user.type(input, "a");
  //   await user.tab();

  //   await waitFor(() => {
  //     expect(input).toHaveAttribute("aria-invalid", "true");
  //   });
  // });

  it("renders form description with correct id and association", () => {
    render(<TestForm />);

    const input = screen.getByLabelText("Username");
    const description = screen.getByText("Enter your username");

    expect(input).toHaveAttribute("aria-describedby", description.id);
  });
});
