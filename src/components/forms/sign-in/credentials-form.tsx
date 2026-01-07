import { useAppForm } from "@/hooks/form";
import { credentialsFormOpts } from "./credentials-form-options";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate, Link } from "@tanstack/react-router";
import { FieldGroup, FieldLabel } from "@/components/ui/field";

interface SignInCredentialsFormProps {
  onVerificationRequired: (email: string) => void;
  redirectTo?: string;
}

export function SignInCredentialsForm({
  onVerificationRequired,
  redirectTo,
}: SignInCredentialsFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  const form = useAppForm({
    ...credentialsFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("flow", "signIn");
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
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-balance">
            Login to your account
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
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  to="/password-reset"
                  className="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <field.TextField
                label=""
                type="password"
              />
            </div>
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Sign in" />
        </form.AppForm>
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/sign-up"
            search={{ redirectTo: redirectTo || undefined }}
            className="underline-offset-2 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}

