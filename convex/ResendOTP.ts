"use node";

import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { generateRandomString } from "@oslojs/crypto/random";
import type { RandomReader } from "@oslojs/crypto/random";

export const ResendOTP = Resend({
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
    console.log("[ResendOTP] Sending verification email", { email, tokenLength: token.length });
    
    const { error, data } = await resend.emails.send({
      from: "My App <hello@trybriefly.com>",
      to: [email],
      subject: `Sign in to My App`,
      text: `Your code is ${token}`,
    });

    if (error) {
      console.error("[ResendOTP] Failed to send verification email", {
        email,
        error: JSON.stringify(error, null, 2),
        errorType: error.constructor.name,
      });
      throw new Error(`Could not send verification email: ${JSON.stringify(error)}`);
    }

    console.log("[ResendOTP] Verification email sent successfully", {
      email,
      messageId: data?.id,
    });
  },
});

