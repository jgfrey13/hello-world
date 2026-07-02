/**
 * Pure mapping from Stripe subscription state to our database state —
 * unit-tested in tests/unit/stripe.test.ts. The webhook route applies the
 * result with the service client.
 *
 * Invariant (paid-content firewall / listing preservation): a canceled or
 * delinquent subscription downgrades the brand's TIER to basic but never
 * touches the brand's published STATUS, classification, or verification.
 */

export type SubscriptionStatus =
  "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export interface StripeSubscriptionFacts {
  id: string;
  customerId: string;
  status: string;
  priceId: string | null;
  currentPeriodStart: number | null; // unix seconds
  currentPeriodEnd: number | null;
  plan: "verified" | "featured" | null;
}

export interface SubscriptionUpdate {
  subscription: {
    provider_subscription_id: string;
    provider_customer_id: string;
    status: SubscriptionStatus;
    plan: "basic" | "verified" | "featured";
    current_period_start: string | null;
    current_period_end: string | null;
  };
  /** The tier to write on brands.subscription_tier. */
  brandTier: "basic" | "verified" | "featured";
}

export function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
      return status;
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "incomplete";
  }
}

function toIso(unixSeconds: number | null): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export function computeSubscriptionUpdate(
  facts: StripeSubscriptionFacts,
): SubscriptionUpdate {
  const status = mapStripeStatus(facts.status);
  const entitled = status === "active" || status === "trialing";
  const plan = entitled && facts.plan ? facts.plan : "basic";

  return {
    subscription: {
      provider_subscription_id: facts.id,
      provider_customer_id: facts.customerId,
      status,
      plan,
      current_period_start: toIso(facts.currentPeriodStart),
      current_period_end: toIso(facts.currentPeriodEnd),
    },
    // Cancellation preserves the free Basic listing: tier drops, nothing else.
    brandTier: plan,
  };
}
