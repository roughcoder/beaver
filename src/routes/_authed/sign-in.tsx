import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/components/forms/sign-in/sign-in-form";

export const Route = createFileRoute("/_authed/sign-in")({
  component: SignIn,
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: (search.redirectTo as string) || undefined,
  }),
});

function SignIn() {
  const { redirectTo } = Route.useSearch();
  return <SignInForm redirectTo={redirectTo} />;
}
