import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { SignUpCredentialsForm } from "./credentials-form";
import { SignUpVerifyCodeForm } from "./verify-code-form";

interface SignUpFormProps {
  redirectTo?: string;
}

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const [step, setStep] = useState<"signUp" | { email: string }>("signUp");
  const [signupsDisabled, setSignupsDisabled] = useState(false);

  if (signupsDisabled) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <Card className="max-w-lg">
          <CardContent className="flex flex-col gap-3 p-8 text-center">
            <h1 className="text-2xl font-bold">We&apos;re in preview</h1>
            <p className="text-muted-foreground text-sm">
              Sign ups are temporarily disabled while we get everything ready.
              Please check back soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            {step === "signUp" ? (
              <SignUpCredentialsForm
                onVerificationRequired={(email) => setStep({ email })}
                redirectTo={redirectTo}
                onSignupsDisabled={() => setSignupsDisabled(true)}
              />
            ) : (
              <SignUpVerifyCodeForm
                email={step.email}
                onCancel={() => setStep("signUp")}
                redirectTo={redirectTo}
              />
            )}
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <button type="button" className="underline-offset-2 hover:underline">
          Terms of Service
        </button>{" "}
        and{" "}
        <button type="button" className="underline-offset-2 hover:underline">
          Privacy Policy
        </button>
        .
      </FieldDescription>
    </div>
  );
}
