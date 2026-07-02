import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planForPriceId, stripeConfigured } from "@/lib/stripe";
import {
  computeSubscriptionUpdate,
  type StripeSubscriptionFacts,
} from "@/lib/stripe/sync";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/database/audit";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook: signature-verified, idempotent, service-role writes.
 * Never trusts client-reported paid status — this endpoint is the ONLY
 * writer of subscription state.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "billing not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  // Idempotency: claim the event id before applying side effects. A
  // redelivered event hits the primary key and is acknowledged without
  // re-applying anything.
  const { error: claimError } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: event.id, event_type: event.type });
  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error(`webhook event claim failed: ${claimError.message}`);
    return NextResponse.json({ error: "storage failure" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );
          await applySubscription(subscription, session.metadata?.brand_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await applySubscription(subscription, subscription.metadata?.brand_id);
        break;
      }
      default:
        // Unhandled event types are acknowledged and ignored.
        break;
    }
  } catch (error) {
    // Applying failed after claiming the event id: release the claim so
    // Stripe's retry can re-attempt the side effects.
    await supabase.from("stripe_webhook_events").delete().eq("id", event.id);
    console.error("webhook apply failed:", error);
    return NextResponse.json({ error: "apply failure" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function applySubscription(
  subscription: Stripe.Subscription,
  brandIdFromMetadata: string | undefined,
) {
  const supabase = createSupabaseServiceClient();
  const item = subscription.items.data[0];
  const facts: StripeSubscriptionFacts = {
    id: subscription.id,
    customerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    status: subscription.status,
    priceId: item?.price?.id ?? null,
    currentPeriodStart: item?.current_period_start ?? null,
    currentPeriodEnd: item?.current_period_end ?? null,
    plan: planForPriceId(item?.price?.id),
  };
  const update = computeSubscriptionUpdate(facts);

  // Resolve the brand: metadata first (set at checkout), else an existing
  // subscription row for this provider subscription id.
  let brandId = brandIdFromMetadata ?? null;
  if (!brandId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("brand_id")
      .eq("provider_subscription_id", subscription.id)
      .maybeSingle();
    brandId = existing?.brand_id ?? null;
  }
  if (!brandId) {
    throw new Error(
      `no brand resolvable for Stripe subscription ${subscription.id}`,
    );
  }

  const { error: upsertError } = await supabase.from("subscriptions").upsert(
    {
      brand_id: brandId,
      user_id: subscription.metadata?.user_id ?? null,
      payment_provider: "stripe",
      ...update.subscription,
    },
    { onConflict: "provider_subscription_id" },
  );
  if (upsertError) {
    throw new Error(`subscription upsert failed: ${upsertError.message}`);
  }

  // Tier only — published status, classification, and verification are
  // untouched by billing, in both directions.
  const { error: tierError } = await supabase
    .from("brands")
    .update({ subscription_tier: update.brandTier })
    .eq("id", brandId);
  if (tierError) {
    throw new Error(`brand tier update failed: ${tierError.message}`);
  }

  await recordAudit({
    actor: null,
    action: `stripe_subscription_${subscription.status}`,
    entity: "subscriptions",
    entityId: null,
    after: {
      brand_id: brandId,
      plan: update.subscription.plan,
      status: update.subscription.status,
    },
  });
}
