import "server-only";
import Stripe from "stripe";

/**
 * Stripe client + plan/price configuration. Billing is OPTIONAL config:
 * when the env vars are absent the app runs with billing disabled and the
 * UI says so honestly — nothing pretends to work.
 */

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_VERIFIED &&
    process.env.STRIPE_PRICE_FEATURED,
  );
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export type PaidPlan = "verified" | "featured";

export function priceIdForPlan(plan: PaidPlan): string {
  const priceId =
    plan === "verified"
      ? process.env.STRIPE_PRICE_VERIFIED
      : process.env.STRIPE_PRICE_FEATURED;
  if (!priceId) throw new Error(`Price id for plan ${plan} is not configured`);
  return priceId;
}

export function planForPriceId(
  priceId: string | null | undefined,
): PaidPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_VERIFIED) return "verified";
  if (priceId === process.env.STRIPE_PRICE_FEATURED) return "featured";
  return null;
}
