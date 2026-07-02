import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database/types";
import type {
  BrandListItem,
  EvidenceListItem,
  Paginated,
  ProductListItem,
} from "@/lib/database/shapes";
import { PAGE_SIZE, type BrandSearchParams } from "@/lib/search/params";
import type { ManufacturingClassification } from "@/lib/verification/classification";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

const BRAND_LIST_SELECT =
  "id, slug, name, summary, headquarters_state, price_level, verification_status, is_sponsored, is_featured, is_demo, brand_categories(categories(name, slug))";

type BrandListRow = Pick<
  BrandRow,
  | "id"
  | "slug"
  | "name"
  | "summary"
  | "headquarters_state"
  | "price_level"
  | "verification_status"
  | "is_sponsored"
  | "is_featured"
  | "is_demo"
> & {
  brand_categories: { categories: { name: string; slug: string } | null }[];
};

function toBrandListItem(row: BrandListRow): BrandListItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    state: row.headquarters_state,
    priceLevel: row.price_level,
    categories: row.brand_categories
      .map((link) => link.categories?.name)
      .filter((name): name is string => Boolean(name)),
    isVerified: row.verification_status === "approved",
    isSponsored: row.is_sponsored,
    isDemo: row.is_demo,
  };
}

/**
 * Directory search over published brands. RLS already restricts anon reads to
 * published rows; the explicit status filter keeps intent visible and covers
 * signed-in staff, for whom RLS is wider.
 */
export async function searchBrands(
  params: BrandSearchParams,
): Promise<Paginated<BrandListItem>> {
  const supabase = await createSupabaseServerClient();
  const from = (params.page - 1) * PAGE_SIZE;

  let query = supabase
    .from("brands")
    .select(
      params.category
        ? // Inner joins so category filtering excludes non-matching brands.
          BRAND_LIST_SELECT.replace(
            "brand_categories(categories(",
            "brand_categories!inner(categories!inner(",
          )
        : BRAND_LIST_SELECT,
      { count: "exact" },
    )
    .eq("status", "published");

  if (params.q)
    query = query.textSearch("search_tsv", params.q, { type: "websearch" });
  if (params.category)
    query = query.eq("brand_categories.categories.slug", params.category);
  if (params.state) query = query.eq("headquarters_state", params.state);
  if (params.price) query = query.eq("price_level", params.price);
  if (params.classification) {
    // Brands with at least one published product carrying the classification.
    const { data: brandIds } = await supabase
      .from("products")
      .select("brand_id")
      .eq("status", "published")
      .eq("manufacturing_classification", params.classification);
    const ids = [...new Set((brandIds ?? []).map((r) => r.brand_id))];
    if (ids.length === 0) {
      return { items: [], total: 0, page: 1, totalPages: 0, hasDemo: false };
    }
    query = query.in("id", ids);
  }

  // "relevance" currently orders featured-first then name; true ts_rank
  // ordering needs an RPC (documented in docs/known-limitations.md).
  if (params.sort === "newest") {
    query = query.order("published_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (params.sort === "name") {
    query = query.order("name");
  } else {
    query = query.order("is_featured", { ascending: false }).order("name");
  }

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`searchBrands failed: ${error.message}`);

  const items = ((data ?? []) as unknown as BrandListRow[]).map(
    toBrandListItem,
  );
  const total = count ?? items.length;
  return {
    items,
    total,
    page: params.page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    hasDemo: items.some((item) => item.isDemo),
  };
}

export async function getFeaturedBrands(limit = 3): Promise<BrandListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select(BRAND_LIST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("name")
    .limit(limit);
  if (error) throw new Error(`getFeaturedBrands failed: ${error.message}`);
  return ((data ?? []) as unknown as BrandListRow[]).map(toBrandListItem);
}

/** Distinct HQ states of published brands, for the directory filter. */
export async function getBrandStates(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("headquarters_state")
    .eq("status", "published")
    .not("headquarters_state", "is", null);
  if (error) throw new Error(`getBrandStates failed: ${error.message}`);
  return [...new Set(data.map((r) => r.headquarters_state as string))].sort();
}

export interface BrandProfile {
  brand: BrandRow;
  categories: { name: string; slug: string }[];
  locations: {
    id: string;
    facilityName: string | null;
    city: string | null;
    state: string | null;
    locationType: string;
  }[];
  products: ProductListItem[];
  evidence: EvidenceListItem[];
  /** Published-product counts per classification — the honest brand-level view. */
  classificationCounts: Partial<Record<ManufacturingClassification, number>>;
}

export async function getBrandBySlug(
  slug: string,
): Promise<BrandProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: brand, error } = await supabase
    .from("brands")
    .select("*, brand_categories(categories(name, slug))")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getBrandBySlug failed: ${error.message}`);
  if (!brand) return null;

  const [locationsRes, productsRes, evidenceRes] = await Promise.all([
    supabase
      .from("manufacturing_locations")
      .select("id, facility_name, city, state, location_type")
      .eq("brand_id", brand.id),
    supabase
      .from("products")
      .select(
        "id, slug, name, summary, price_amount, price_is_approximate, manufacturing_classification, is_sponsored, is_demo, categories(name)",
      )
      .eq("brand_id", brand.id)
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("name"),
    supabase
      .from("public_evidence")
      .select("*")
      .eq("brand_id", brand.id)
      .order("last_verified_at", { ascending: false, nullsFirst: false }),
  ]);

  for (const res of [locationsRes, productsRes, evidenceRes]) {
    if (res.error)
      throw new Error(`getBrandBySlug detail failed: ${res.error.message}`);
  }

  const products: ProductListItem[] = (productsRes.data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandSlug: brand.slug,
    brandName: brand.name,
    category: p.categories?.name ?? null,
    summary: p.summary,
    priceAmount: p.price_amount,
    priceIsApproximate: p.price_is_approximate,
    classification: p.manufacturing_classification,
    isSponsored: p.is_sponsored,
    isDemo: p.is_demo,
  }));

  const classificationCounts: BrandProfile["classificationCounts"] = {};
  for (const product of products) {
    classificationCounts[product.classification] =
      (classificationCounts[product.classification] ?? 0) + 1;
  }

  return {
    brand,
    categories: (
      brand.brand_categories as {
        categories: { name: string; slug: string } | null;
      }[]
    )
      .map((link) => link.categories)
      .filter((c): c is { name: string; slug: string } => Boolean(c)),
    locations: (locationsRes.data ?? []).map((l) => ({
      id: l.id,
      facilityName: l.facility_name,
      city: l.city,
      state: l.state,
      locationType: l.location_type,
    })),
    products,
    evidence: ((evidenceRes.data ?? []) as Record<string, unknown>[]).map(
      (e) => ({
        id: e.id as string,
        classification: e.classification as ManufacturingClassification,
        sourceUrl: e.source_url as string | null,
        sourceTitle: e.source_title as string | null,
        evidenceNote: e.evidence_note as string | null,
        evidenceType: e.evidence_type as string,
        accessedAt: e.accessed_at as string | null,
        lastVerifiedAt: e.last_verified_at as string | null,
      }),
    ),
    classificationCounts,
  };
}

/** Published brands selectable in the claim form (id + name only). */
export async function getClaimableBrands(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("status", "published")
    .order("name");
  if (error) throw new Error(`getClaimableBrands failed: ${error.message}`);
  return data ?? [];
}
