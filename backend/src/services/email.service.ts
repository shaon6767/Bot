import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const RESEND_URL = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<boolean> {
  if (!env.resendApiKey) {
    logger.error("No RESEND_API_KEY configured — cannot send reset email");
    return false;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.resendApiKey}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, ignore this email.</p>`,
      }),
    });

    if (!response.ok) {
      logger.error(`Resend request failed: ${response.status}`);
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Failed to send reset email", err);
    return false;
  }
}
