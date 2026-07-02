import "server-only";
import { sendEmail } from "@/lib/email";

/**
 * Transactional notification helpers. All fire-and-forget: a mail failure
 * must never fail the action that triggered it. Bodies are plain text and
 * contain no secrets, internal notes, or other users' data.
 */

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Alert the operations inbox about a new review-queue item. */
export async function notifyAdmin(
  kind: string,
  summary: string,
): Promise<void> {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) return; // preference unset — no admin alerts in this environment
  await sendEmail({
    to,
    subject: `[MadeHere] New ${kind} awaiting review`,
    text: `${summary}\n\nReview queue: ${SITE()}/admin\n`,
  });
}

export async function notifyClaimDecision(options: {
  to: string;
  brandName: string;
  decision: "approved" | "rejected";
}): Promise<void> {
  const { to, brandName, decision } = options;
  const body =
    decision === "approved"
      ? `Your claim for ${brandName} was approved. You now have brand-owner access:\n${SITE()}/brand-dashboard\n\nEdits you submit go to our review team; manufacturing classifications always follow the evidence.`
      : `Your claim for ${brandName} was not approved. If you believe this is a mistake, reply with additional proof of affiliation and we'll take another look.`;
  await sendEmail({
    to,
    subject: `[MadeHere] Your profile claim for ${brandName} was ${decision}`,
    text: body,
  });
}
