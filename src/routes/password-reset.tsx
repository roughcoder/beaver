import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { PasswordResetForm } from "../components/PasswordResetForm";

export const Route = createFileRoute("/password-reset")({
  component: PasswordReset,
});

function PasswordReset() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <PasswordResetForm />
    </div>
  );
}

