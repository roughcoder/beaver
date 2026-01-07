import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { PasswordResetRequestForm } from "./request-form";
import { PasswordResetVerifyForm } from "./verify-form";

export function PasswordResetForm() {
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            {step === "forgot" ? (
              <PasswordResetRequestForm
                onCodeSent={(email) => setStep({ email })}
              />
            ) : (
              <PasswordResetVerifyForm
                email={step.email}
                onCancel={() => setStep("forgot")}
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
