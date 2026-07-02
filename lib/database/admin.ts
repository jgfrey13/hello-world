import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin dashboard metrics. All reads use the signed-in user's client, so RLS
 * enforces staff access at the database even if a server check were bypassed.
 * Every count is a real query — no fabricated metrics.
 */

export interface AdminMetrics {
  publishedBrands: number;
  publishedProducts: number;
  pendingBrands: number;
  pendingProducts: number;
  pendingEvidence: number;
  pendingClaims: number;
  pendingCorrections: number;
  pendingSubmissions: number;
  pendingChanges: number;
  newsletterSubscribers: number;
  affiliateClicks30d: number;
  payingBrands: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createSupabaseServerClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const head = { count: "exact" as const, head: true };

  const [
    publishedBrands,
    publishedProducts,
    pendingBrands,
    pendingProducts,
    pendingEvidence,
    pendingClaims,
    pendingCorrections,
    pendingSubmissions,
    pendingChanges,
    newsletterSubscribers,
    affiliateClicks30d,
    payingBrands,
  ] = await Promise.all([
    supabase.from("brands").select("id", head).eq("status", "published"),
    supabase.from("products").select("id", head).eq("status", "published"),
    supabase
      .from("brands")
      .select("id", head)
      .in("status", ["draft", "pending_review"]),
    supabase
      .from("products")
      .select("id", head)
      .in("status", ["draft", "pending_review"]),
    supabase
      .from("manufacturing_evidence")
      .select("id", head)
      .eq("review_status", "pending"),
    supabase.from("brand_claims").select("id", head).eq("status", "pending"),
    supabase.from("corrections").select("id", head).eq("status", "pending"),
    supabase
      .from("brand_submissions")
      .select("id", head)
      .eq("status", "pending"),
    supabase
      .from("proposed_changes")
      .select("id", head)
      .eq("status", "pending"),
    supabase
      .from("newsletter_subscribers")
      .select("id", head)
      .eq("status", "active"),
    supabase
      .from("affiliate_clicks")
      .select("id", head)
      .gte("clicked_at", thirtyDaysAgo),
    supabase
      .from("brands")
      .select("id", head)
      .neq("subscription_tier", "basic")
      .eq("status", "published"),
  ]).then((results) =>
    results.map((result) => {
      if (result.error)
        throw new Error(`admin metric failed: ${result.error.message}`);
      return result.count ?? 0;
    }),
  );

  return {
    publishedBrands,
    publishedProducts,
    pendingBrands,
    pendingProducts,
    pendingEvidence,
    pendingClaims,
    pendingCorrections,
    pendingSubmissions,
    pendingChanges,
    newsletterSubscribers,
    affiliateClicks30d,
    payingBrands,
  };
}
