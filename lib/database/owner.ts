import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/database/types";

/**
 * Brand-owner dashboard queries. Reads use the signed-in user's client, so
 * RLS limits visibility to the owner's granted brands. The analytics
 * aggregate uses the service client ONLY after an explicit ownership check
 * (owners get counts, never raw click rows).
 */

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

export interface OwnedBrandSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionTier: string;
  verificationStatus: string;
}

export async function getOwnedBrands(): Promise<OwnedBrandSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_owners")
    .select(
      "brands!inner(id, name, slug, status, subscription_tier, verification_status)",
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getOwnedBrands failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.brands.id,
    name: row.brands.name,
    slug: row.brands.slug,
    status: row.brands.status,
    subscriptionTier: row.brands.subscription_tier,
    verificationStatus: row.brands.verification_status,
  }));
}

export interface OwnedBrandDetail {
  brand: BrandRow;
  products: {
    id: string;
    name: string;
    slug: string;
    status: string;
    classification: string;
  }[];
  pendingChanges: {
    id: string;
    changeType: string;
    status: string;
    createdAt: string;
  }[];
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
}

/** Returns null unless the signed-in user owns the brand (RLS-backed). */
export async function getOwnedBrandDetail(
  brandId: string,
): Promise<OwnedBrandDetail | null> {
  const supabase = await createSupabaseServerClient();

  // Ownership check via RLS: brand_owners only returns the user's own rows.
  const { data: grant } = await supabase
    .from("brand_owners")
    .select("brand_id")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (!grant) return null;

  const [{ data: brand }, productsRes, changesRes, subscriptionRes] =
    await Promise.all([
      supabase.from("brands").select("*").eq("id", brandId).maybeSingle(),
      supabase
        .from("products")
        .select("id, name, slug, status, manufacturing_classification")
        .eq("brand_id", brandId)
        .order("name"),
      supabase
        .from("proposed_changes")
        .select("id, change_type, status, created_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("brand_id", brandId)
        .maybeSingle(),
    ]);
  if (!brand) return null;

  return {
    brand,
    products: (productsRes.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      classification: product.manufacturing_classification,
    })),
    pendingChanges: (changesRes.data ?? []).map((change) => ({
      id: change.id,
      changeType: change.change_type,
      status: change.status,
      createdAt: change.created_at,
    })),
    subscription: subscriptionRes.data
      ? {
          plan: subscriptionRes.data.plan,
          status: subscriptionRes.data.status,
          currentPeriodEnd: subscriptionRes.data.current_period_end,
        }
      : null,
  };
}

export interface BrandAnalytics {
  profileViews30d: number;
  productViews30d: number;
  outboundClicks30d: number;
}

/**
 * Aggregate counts for the owner dashboard. Requires a prior ownership check
 * by the caller (getOwnedBrandDetail). Counts only — raw analytics rows are
 * admin-only.
 */
export async function getBrandAnalytics(
  brandId: string,
): Promise<BrandAnalytics> {
  const service = createSupabaseServiceClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const head = { count: "exact" as const, head: true };

  const [views, productViews, clicks] = await Promise.all([
    service
      .from("analytics_events")
      .select("id", head)
      .eq("event_type", "brand_view")
      .eq("brand_id", brandId)
      .gte("occurred_at", since),
    service
      .from("analytics_events")
      .select("id", head)
      .eq("event_type", "product_view")
      .eq("brand_id", brandId)
      .gte("occurred_at", since),
    service
      .from("affiliate_clicks")
      .select("id", head)
      .eq("brand_id", brandId)
      .gte("clicked_at", since),
  ]);

  return {
    profileViews30d: views.count ?? 0,
    productViews30d: productViews.count ?? 0,
    outboundClicks30d: clicks.count ?? 0,
  };
}
