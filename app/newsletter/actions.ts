"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, isSpamSubmission } from "@/lib/security/rate-limit";
import { newsletterSignupSchema } from "@/lib/validation";
import { recordEvent } from "@/lib/analytics/events";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

export type NewsletterActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "error" };

/**
 * Newsletter signup: consent timestamp + source recorded; duplicates are
 * idempotent; a previously unsubscribed address is re-subscribed with fresh
 * consent. Service-role write — the table has no public policies.
 */
export async function subscribeNewsletterAction(
  _previous: NewsletterActionState,
  formData: FormData,
): Promise<NewsletterActionState> {
  if (isSpamSubmission(formData)) return { status: "success" }; // trap: fake ok

  const limit = await checkRateLimit("newsletter");
  if (!limit.allowed) return { status: "rate_limited" };

  const parsed = newsletterSignupSchema.safeParse({
    email: formData.get("email"),
    consentSource: formData.get("consentSource") || "site",
  });
  if (!parsed.success) return { status: "invalid" };
  const { email, consentSource } = parsed.data;

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    status: "active",
    consent_source: consentSource,
  });

  if (error) {
    if (error.code === "23505") {
      // Already on file. If unsubscribed, this signup is fresh consent.
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "active",
          consent_at: new Date().toISOString(),
          consent_source: consentSource,
          unsubscribed_at: null,
        })
        .eq("email", email)
        .eq("status", "unsubscribed");
      if (updateError) return { status: "error" };
      return { status: "success" }; // idempotent for already-active addresses
    }
    return { status: "error" };
  }

  await recordEvent({ type: "newsletter_signup", path: `/${consentSource}` });
  return { status: "success" };
}

/** One-click unsubscribe via HMAC token (from email links). */
export async function unsubscribeByToken(
  email: string,
  token: string,
): Promise<boolean> {
  if (!verifyUnsubscribeToken(email, token)) return false;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email.trim().toLowerCase());
  return !error;
}
