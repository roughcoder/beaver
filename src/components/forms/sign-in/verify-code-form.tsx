import { useAppForm } from "@/hooks/form";
import { verifyCodeFormOpts } from "./verify-code-form-options";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { FieldGroup, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface SignInVerifyCodeFormProps {
  email: string;
  onCancel: () => void;
  redirectTo?: string;
}

export function SignInVerifyCodeForm({
  email,
  onCancel,
  redirectTo,
}: SignInVerifyCodeFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  const form = useAppForm({
    ...verifyCodeFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("flow", "email-verification");
      formData.append("email", email);
      formData.append("code", value.code);

      const result = await signIn("password", formData);

      if (result.signingIn) {
        navigate({
          to: redirectTo || "/",
        });
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
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground text-balance">
            Enter the verification code
          </p>
        </div>
        <form.AppField name="code">
          {(field) => <field.OtpField />}
        </form.AppField>
        <FieldDescription>
          Enter the code sent to {email}
        </FieldDescription>
        <form.AppForm>
          <form.SubmitButton label="Continue" />
        </form.AppForm>
        <form.AppForm>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </form.AppForm>
      </FieldGroup>
    </form>
  );
}

