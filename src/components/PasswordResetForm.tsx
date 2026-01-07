import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

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

  return step === "forgot" ? (
    <form onSubmit={handleRequestReset}>
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
      <button type="submit">Send code</button>
    </form>
  ) : (
    <form onSubmit={handleVerifyReset}>
      <div>
        <label htmlFor="code">Reset Code</label>
        <input
          id="code"
          name="code"
          placeholder="Code"
          type="text"
          required
        />
      </div>
      <div>
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          name="newPassword"
          placeholder="New password"
          type="password"
          required
        />
      </div>
      <p>Enter the code sent to {step.email}</p>
      <button type="submit">Continue</button>
      <button
        type="button"
        onClick={() => setStep("forgot")}
      >
        Cancel
      </button>
    </form>
  );
}

