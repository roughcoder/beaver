import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./ResendOTP";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

const enableEmailVerification = process.env.AUTH_ENABLE_EMAIL_VERIFICATION === "true";

const passwordProviderConfig = enableEmailVerification
  ? Password({ verify: ResendOTP, reset: ResendOTPPasswordReset })
  : Password();

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProviderConfig],
});
