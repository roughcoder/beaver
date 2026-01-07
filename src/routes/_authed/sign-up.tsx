import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/components/forms/sign-up/sign-up-form";

export const Route = createFileRoute("/_authed/sign-up")({
  component: SignUp,
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: (search.redirectTo as string) || undefined,
  }),
});

function SignUp() {
  const { redirectTo } = Route.useSearch();
  return <SignUpForm redirectTo={redirectTo} />;
}
