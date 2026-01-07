import { useAppForm } from "@/hooks/form";
import { requestFormOpts } from "./request-form-options";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { FieldGroup } from "@/components/ui/field";

interface PasswordResetRequestFormProps {
  onCodeSent: (email: string) => void;
}

export function PasswordResetRequestForm({
  onCodeSent,
}: PasswordResetRequestFormProps) {
  const { signIn } = useAuthActions();

  const form = useAppForm({
    ...requestFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("flow", "reset");
      formData.append("email", value.email);

      await signIn("password", formData);
      onCodeSent(value.email);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-balance">
            Enter your email to receive a reset code
          </p>
        </div>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email"
              placeholder="m@example.com"
              type="email"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Send reset code" />
        </form.AppForm>
        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            to="/sign-in"
            className="underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}

