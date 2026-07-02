import "server-only";
import { Resend } from "resend";

/**
 * Transactional email via Resend. Email is OPTIONAL config: when
 * RESEND_API_KEY / EMAIL_FROM are absent, sends are skipped and logged —
 * features degrade honestly instead of pretending mail went out.
 * No bulk/marketing sends live here; campaigns stay out of scope until
 * sender-domain auth + consent + unsubscribe are verified (see docs).
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export interface SendEmailResult {
  sent: boolean;
  reason?: "not_configured" | "send_failed";
}

/** Plain-text transactional send. Never throws; failures are logged. */
export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendEmailResult> {
  if (!emailConfigured()) {
    console.info(
      `email disabled (no Resend config); skipped send: ${message.subject}`,
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    if (error) {
      // Log the failure without the message body (may contain user content).
      console.error(`email send failed (${message.subject}): ${error.message}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error(`email send failed (${message.subject}):`, error);
    return { sent: false, reason: "send_failed" };
  }
}
