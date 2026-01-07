import { createFileRoute } from "@tanstack/react-router";
import { PasswordResetForm } from "@/components/forms/password-reset/password-reset-form";

export const Route = createFileRoute("/_authed/password-reset")({
  component: PasswordReset,
});

function PasswordReset() {
  return <PasswordResetForm />;
}

