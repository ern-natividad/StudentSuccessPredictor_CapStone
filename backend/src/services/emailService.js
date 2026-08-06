import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env.js";

const brevo = new BrevoClient({
  apiKey: env.brevoApiKey,
  timeoutInSeconds: 30,
  maxRetries: 2,
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendPasswordResetOtpEmail = async ({ to, code }) => {
  const safeCode = escapeHtml(code);

  return brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: env.brevoSenderName,
      email: env.brevoSenderEmail,
    },
    to: [{ email: to }],
    subject: `${code} is your account recovery code`,
    textContent: `Use this 6-digit verification code to reset your College of Engineering portal password: ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #800000; text-align: center;">Account Recovery Request</h2>
        <p>We received a request to reset your password for the College of Engineering portal.</p>
        <p>Use the following 6-digit verification code to proceed:</p>
        <div style="background: #f4f4f4; text-align: center; font-size: 28px; font-weight: bold; padding: 15px; letter-spacing: 6px; color: #333; margin: 20px 0; border-radius: 4px;">${safeCode}</div>
        <p style="font-size: 12px; color: #666;">This verification code expires in 10 minutes. If you did not make this request, you can safely ignore this message.</p>
      </div>
    `,
  });
};
