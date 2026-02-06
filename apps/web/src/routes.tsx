import { Navigate, Route, Routes } from "react-router";
import App from "./App";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

// Auth pages
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { MfaSetupPage } from "./pages/auth/MfaSetupPage";
import { MfaVerifyPage } from "./pages/auth/MfaVerifyPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { ProfilePage } from "./pages/ProfilePage";

/**
 * Redirect authenticated users away from auth pages
 */
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Protected main app */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Auth routes */}
      <Route
        path="/auth/sign-in"
        element={
          <AuthRoute>
            <SignInPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/sign-up"
        element={
          <AuthRoute>
            <SignUpPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/verify-email"
        element={
          <AuthRoute>
            <VerifyEmailPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <AuthRoute>
            <ForgotPasswordPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <AuthRoute>
            <ResetPasswordPage />
          </AuthRoute>
        }
      />

      {/* MFA routes - can be accessed during sign-in flow */}
      <Route path="/auth/mfa-setup" element={<MfaSetupPage />} />
      <Route path="/auth/mfa-verify" element={<MfaVerifyPage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
