"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getStripe, priceIdForPlan, stripeConfigured } from "@/lib/stripe";
import { publicEnv } from "@/lib/security/env";
import { z } from "zod";

async function requireOwnership(brandId: string) {
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: grant } = await supabase
    .from("brand_owners")
    .select("brand_id")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (!grant) redirect("/brand-dashboard");
  return { user, supabase };
}

/**
 * Start a Stripe Checkout session for a plan upgrade. Server-side only:
 * the client never reports paid status — entitlement is written exclusively
 * by the signature-verified webhook.
 */
export async function startCheckoutAction(formData: FormData) {
  const brandId = z.string().uuid().parse(formData.get("brandId"));
  const plan = z.enum(["verified", "featured"]).parse(formData.get("plan"));
  const { user, supabase } = await requireOwnership(brandId);

  if (!stripeConfigured()) {
    redirect(`/brand-dashboard/brands/${brandId}?status=billing_unconfigured`);
  }

  const stripe = getStripe();
  const siteUrl = publicEnv().NEXT_PUBLIC_SITE_URL;

  // Reuse the brand's Stripe customer when one exists.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("brand_id", brandId)
    .maybeSingle();

  let customerId = existing?.provider_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { brand_id: brandId, user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    metadata: { brand_id: brandId, user_id: user.id, plan },
    subscription_data: {
      metadata: { brand_id: brandId, user_id: user.id, plan },
    },
    success_url: `${siteUrl}/brand-dashboard/brands/${brandId}?status=billing_success`,
    cancel_url: `${siteUrl}/brand-dashboard/brands/${brandId}?status=billing_canceled`,
  });

  if (!session.url) {
    redirect(`/brand-dashboard/brands/${brandId}?status=error`);
  }
  redirect(session.url!);
}

/** Open the Stripe Customer Portal for the brand's existing customer. */
export async function openBillingPortalAction(formData: FormData) {
  const brandId = z.string().uuid().parse(formData.get("brandId"));
  const { supabase } = await requireOwnership(brandId);

  if (!stripeConfigured()) {
    redirect(`/brand-dashboard/brands/${brandId}?status=billing_unconfigured`);
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (!subscription?.provider_customer_id) {
    redirect(`/brand-dashboard/brands/${brandId}?status=error`);
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription!.provider_customer_id!,
    return_url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/brand-dashboard/brands/${brandId}`,
  });
  redirect(portal.url);
}
