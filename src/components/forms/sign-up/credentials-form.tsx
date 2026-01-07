import { useAppForm } from "@/hooks/form";
import { credentialsFormOpts } from "./credentials-form-options";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate, Link } from "@tanstack/react-router";
import { FieldGroup } from "@/components/ui/field";

interface SignUpCredentialsFormProps {
  onVerificationRequired: (email: string) => void;
  redirectTo?: string;
}

export function SignUpCredentialsForm({
  onVerificationRequired,
  redirectTo,
}: SignUpCredentialsFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  const form = useAppForm({
    ...credentialsFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("flow", "signUp");
      formData.append("email", value.email);
      formData.append("password", value.password);

      const result = await signIn("password", formData);

      if (result.signingIn) {
        navigate({
          to: redirectTo || "/",
        });
      } else {
        onVerificationRequired(value.email);
      }
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
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-balance">
            Sign up to get started
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
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label="Password"
              type="password"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Sign up" />
        </form.AppForm>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            search={{ redirectTo: redirectTo || undefined }}
            className="underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}

