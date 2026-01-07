import { useAppForm } from "@/hooks/form";
import { verifyFormOpts } from "./verify-form-options";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "@tanstack/react-router";
import { FieldGroup, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

interface PasswordResetVerifyFormProps {
  email: string;
  onCancel: () => void;
}

export function PasswordResetVerifyForm({
  email,
  onCancel,
}: PasswordResetVerifyFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  const form = useAppForm({
    ...verifyFormOpts,
    onSubmit: async ({ value }) => {
      const formData = new FormData();
      formData.append("flow", "reset-verification");
      formData.append("email", email);
      formData.append("code", value.code);
      formData.append("newPassword", value.newPassword);

      const result = await signIn("password", formData);

      if (result.signingIn) {
        navigate({ to: "/app" });
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
          <h1 className="text-2xl font-bold">Enter reset code</h1>
          <p className="text-muted-foreground text-balance">
            Enter the code sent to your email
          </p>
        </div>
        <form.AppField name="code">
          {(field) => <field.OtpField />}
        </form.AppField>
        <form.AppField name="newPassword">
          {(field) => (
            <field.TextField
              label="New Password"
              placeholder="Enter new password"
              type="password"
            />
          )}
        </form.AppField>
        <FieldDescription>
          Enter the code sent to {email}
        </FieldDescription>
        <form.AppForm>
          <form.SubmitButton label="Reset password" />
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

