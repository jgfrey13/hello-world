import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import {
  computeSubscriptionUpdate,
  mapStripeStatus,
  type StripeSubscriptionFacts,
} from "@/lib/stripe/sync";

function facts(
  overrides: Partial<StripeSubscriptionFacts> = {},
): StripeSubscriptionFacts {
  return {
    id: "sub_123",
    customerId: "cus_123",
    status: "active",
    priceId: "price_verified",
    currentPeriodStart: 1_750_000_000,
    currentPeriodEnd: 1_752_600_000,
    plan: "verified",
    ...overrides,
  };
}

describe("mapStripeStatus", () => {
  it("maps known statuses through and unknown ones to incomplete", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
    expect(mapStripeStatus("unpaid")).toBe("unpaid");
    expect(mapStripeStatus("incomplete_expired")).toBe("incomplete");
    expect(mapStripeStatus("paused")).toBe("incomplete");
    expect(mapStripeStatus("something_new")).toBe("incomplete");
  });
});

describe("computeSubscriptionUpdate", () => {
  it("grants the paid tier for active subscriptions", () => {
    const update = computeSubscriptionUpdate(facts());
    expect(update.brandTier).toBe("verified");
    expect(update.subscription.plan).toBe("verified");
    expect(update.subscription.status).toBe("active");
    expect(update.subscription.current_period_end).toBe(
      new Date(1_752_600_000 * 1000).toISOString(),
    );
  });

  it("grants entitlement during trials", () => {
    expect(
      computeSubscriptionUpdate(facts({ status: "trialing", plan: "featured" }))
        .brandTier,
    ).toBe("featured");
  });

  it("cancellation drops the tier to basic — the free listing survives", () => {
    const update = computeSubscriptionUpdate(facts({ status: "canceled" }));
    expect(update.brandTier).toBe("basic");
    expect(update.subscription.status).toBe("canceled");
    // Nothing else is present in the update: published status,
    // classification, and verification are structurally untouchable here.
    expect(Object.keys(update)).toEqual(["subscription", "brandTier"]);
  });

  it("unpaid and past_due are not entitled to a paid tier", () => {
    expect(
      computeSubscriptionUpdate(facts({ status: "unpaid" })).brandTier,
    ).toBe("basic");
    expect(
      computeSubscriptionUpdate(facts({ status: "past_due" })).brandTier,
    ).toBe("basic");
  });

  it("an unknown price id never grants a paid tier", () => {
    expect(computeSubscriptionUpdate(facts({ plan: null })).brandTier).toBe(
      "basic",
    );
  });
});

describe("webhook signature verification", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_1", type: "ping" });
  const stripe = new Stripe("sk_test_dummy");

  it("accepts a correctly signed payload", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.id).toBe("evt_1");
  });

  it("rejects a payload signed with the wrong secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_wrong",
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload, header, secret),
    ).toThrow();
  });

  it("rejects a tampered payload", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(() =>
      stripe.webhooks.constructEvent(
        payload.replace("ping", "pong"),
        header,
        secret,
      ),
    ).toThrow();
  });
});
