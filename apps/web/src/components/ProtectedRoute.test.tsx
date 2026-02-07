import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";

import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  it("shows loading spinner when isLoading", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    } as any);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <span>Protected content</span>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { getUsername: () => "user" } as any,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      confirmSignUp: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    } as any);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <span>Protected content</span>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
