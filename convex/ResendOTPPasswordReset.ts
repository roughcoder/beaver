"use node";

import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { generateRandomString } from "@oslojs/crypto/random";
import type { RandomReader } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    console.log("[ResendOTPPasswordReset] Sending password reset email", {
      email,
      tokenLength: token.length,
    });

    const { error, data } = await resend.emails.send({
      from: "My App <hello@trybriefly.com>",
      to: [email],
      subject: `Reset your password in My App`,
      text: `Your password reset code is ${token}`,
    });

    if (error) {
      console.error("[ResendOTPPasswordReset] Failed to send password reset email", {
        email,
        error: JSON.stringify(error, null, 2),
        errorType: error.constructor.name,
      });
      throw new Error(`Could not send password reset email: ${JSON.stringify(error)}`);
    }

    console.log("[ResendOTPPasswordReset] Password reset email sent successfully", {
      email,
      messageId: data?.id,
    });
  },
});

