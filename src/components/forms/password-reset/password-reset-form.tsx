import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function PasswordResetForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
  const navigate = useNavigate();

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("flow", "reset");
    await signIn("password", formData);
    setStep({ email: formData.get("email") as string });
  };

  const handleVerifyReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("flow", "reset-verification");
    formData.append("email", step.email);
    const result = await signIn("password", formData);
    if (result.signingIn) {
      navigate({ to: "/app" });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={step === "forgot" ? handleRequestReset : handleVerifyReset}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">
                  {step === "forgot" ? "Reset password" : "Enter reset code"}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {step === "forgot"
                    ? "Enter your email to receive a reset code"
                    : "Enter the code sent to your email"}
                </p>
              </div>
              {step === "forgot" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </Field>
                  <Field>
                    <Button type="submit">Send reset code</Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Remember your password?{" "}
                    <Link
                      to="/sign-in"
                      className="underline-offset-2 hover:underline"
                    >
                      Sign in
                    </Link>
                  </FieldDescription>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="code">Reset Code</FieldLabel>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Enter code"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      required
                    />
                  </Field>
                  <FieldDescription>
                    Enter the code sent to {step.email}
                  </FieldDescription>
                  <Field>
                    <Button type="submit">Reset password</Button>
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("forgot")}
                    >
                      Cancel
                    </Button>
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline-offset-2 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline-offset-2 hover:underline">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}

