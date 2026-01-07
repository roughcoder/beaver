import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

type AuthFlow = "signIn" | "signUp";

interface PasswordAuthFormProps {
  initialFlow: AuthFlow;
  redirectTo?: string;
}

export function PasswordAuthForm({ initialFlow, redirectTo }: PasswordAuthFormProps) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<AuthFlow | { email: string }>(initialFlow);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (step === "signIn" || step === "signUp") {
      formData.append("flow", step);
      const result = await signIn("password", formData);
      if (result.signingIn) {
        // User was immediately signed in (already verified)
        navigate({
          to: redirectTo || "/app",
        });
      } else {
        // User needs to verify email
        setStep({ email: formData.get("email") as string });
      }
    } else {
      // Email verification step
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

  return step === "signIn" || step === "signUp" ? (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          placeholder="Email"
          type="text"
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          placeholder="Password"
          type="password"
          required
        />
      </div>
      <button type="submit">
        {step === "signIn" ? "Sign in" : "Sign up"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep(step === "signIn" ? "signUp" : "signIn");
        }}
      >
        {step === "signIn" ? "Sign up instead" : "Sign in instead"}
      </button>
    </form>
  ) : (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="code">Verification Code</label>
        <input
          id="code"
          name="code"
          placeholder="Code"
          type="text"
          required
        />
      </div>
      <p>Enter the code sent to {step.email}</p>
      <button type="submit">Continue</button>
      <button
        type="button"
        onClick={() => setStep("signIn")}
      >
        Cancel
      </button>
    </form>
  );
}

