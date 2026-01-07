import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { PasswordAuthForm } from "../components/PasswordAuthForm";

export const Route = createFileRoute("/sign-up")({
  component: SignUp,
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: (search.redirectTo as string) || undefined,
  }),
});

function SignUp() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { redirectTo } = Route.useSearch();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo || "/app"} />;
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <PasswordAuthForm initialFlow="signUp" redirectTo={redirectTo} />
    </div>
  );
}

