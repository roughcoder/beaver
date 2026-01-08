import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./ResendOTP";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

const enableEmailVerification = process.env.AUTH_ENABLE_EMAIL_VERIFICATION === "true";
const signupsDisabled = process.env.AUTH_DISABLE_SIGNUPS === "true";

const signUpProfile = (params: Record<string, unknown>) => {
  if (signupsDisabled && params.flow === "signUp") {
    throw new Error("SIGNUPS_DISABLED");
  }

  return {
    email: params.email as string,
  };
};

const passwordProviderConfig = enableEmailVerification
  ? Password({
      verify: ResendOTP,
      reset: ResendOTPPasswordReset,
      profile: signUpProfile,
    })
  : Password({ profile: signUpProfile });

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProviderConfig],
});
