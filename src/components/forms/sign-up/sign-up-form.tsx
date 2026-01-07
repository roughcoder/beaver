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

interface SignUpFormProps {
  redirectTo?: string;
}

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | { email: string }>("signUp");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (step === "signUp") {
      formData.append("flow", "signUp");
      const result = await signIn("password", formData);
      if (result.signingIn) {
        navigate({
          to: redirectTo || "/app",
        });
      } else {
        setStep({ email: formData.get("email") as string });
      }
    } else {
      formData.append("flow", "email-verification");
      formData.append("email", step.email);
      const result = await signIn("password", formData);
      if (result.signingIn) {
        navigate({
          to: redirectTo || "/app",
        });
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Sign up to get started
                </p>
              </div>
              {step === "signUp" ? (
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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </Field>
                  <Field>
                    <Button type="submit">Sign up</Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <Link
                      to="/sign-in"
                      search={redirectTo ? { redirectTo } : undefined}
                      className="underline-offset-2 hover:underline"
                    >
                      Sign in
                    </Link>
                  </FieldDescription>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="code">Verification Code</FieldLabel>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Enter code"
                      required
                    />
                  </Field>
                  <FieldDescription>
                    Enter the code sent to {step.email}
                  </FieldDescription>
                  <Field>
                    <Button type="submit">Continue</Button>
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("signUp")}
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

