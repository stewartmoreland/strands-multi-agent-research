import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { AuthContextValue, User } from "../contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockAuthValue = (
  overrides: Partial<AuthContextValue>,
): AuthContextValue => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  confirmSignUp: vi.fn(),
  resendConfirmationCode: vi.fn(),
  forgotPassword: vi.fn(),
  confirmPassword: vi.fn(),
  mfaChallenge: { required: false, setupRequired: false },
  respondToMfaChallenge: vi.fn(),
  setupTOTP: vi.fn(),
  verifyTOTP: vi.fn(),
  setMfaPreference: vi.fn(),
  getIdToken: vi.fn(),
  getAccessToken: vi.fn(),
  refreshSession: vi.fn(),
  updateUserAttributes: vi.fn(),
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
  ...overrides,
});

describe("ProtectedRoute", () => {
  it("shows loading spinner when isLoading", () => {
    vi.mocked(useAuth).mockReturnValue(
      mockAuthValue({ isAuthenticated: false, isLoading: true, user: null }),
    );
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
    const user: User = {
      email: "user@example.com",
      emailVerified: true,
      sub: "user",
    };
    vi.mocked(useAuth).mockReturnValue(
      mockAuthValue({ isAuthenticated: true, isLoading: false, user }),
    );
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
