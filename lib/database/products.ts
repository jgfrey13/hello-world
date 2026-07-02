import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database/types";
import type {
  EvidenceListItem,
  Paginated,
  ProductListItem,
} from "@/lib/database/shapes";
import { PAGE_SIZE, type ProductSearchParams } from "@/lib/search/params";
import type { ManufacturingClassification } from "@/lib/verification/classification";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const PRODUCT_LIST_SELECT =
  "id, slug, name, summary, price_amount, price_is_approximate, manufacturing_classification, manufacturing_state, is_sponsored, is_featured, is_demo, published_at, brands!inner(name, slug), categories(name, slug)";

type ProductListRow = Pick<
  ProductRow,
  | "id"
  | "slug"
  | "name"
  | "summary"
  | "price_amount"
  | "price_is_approximate"
  | "manufacturing_classification"
  | "manufacturing_state"
  | "is_sponsored"
  | "is_featured"
  | "is_demo"
  | "published_at"
> & {
  brands: { name: string; slug: string };
  categories: { name: string; slug: string } | null;
};

function toProductListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandSlug: row.brands.slug,
    brandName: row.brands.name,
    category: row.categories?.name ?? null,
    summary: row.summary,
    priceAmount: row.price_amount,
    priceIsApproximate: row.price_is_approximate,
    classification: row.manufacturing_classification,
    isSponsored: row.is_sponsored,
    isDemo: row.is_demo,
  };
}

/** Price bands for the directory filter: 1 = under $50, 2 = $50–150, 3 = over $150. */
const PRICE_BANDS: Record<number, { min?: number; max?: number }> = {
  1: { max: 50 },
  2: { min: 50, max: 150 },
  3: { min: 150 },
};

export async function searchProducts(
  params: ProductSearchParams,
): Promise<Paginated<ProductListItem>> {
  const supabase = await createSupabaseServerClient();
  const from = (params.page - 1) * PAGE_SIZE;

  let query = supabase
    .from("products")
    .select(
      params.category
        ? PRODUCT_LIST_SELECT.replace("categories(", "categories!inner(")
        : PRODUCT_LIST_SELECT,
      { count: "exact" },
    )
    .eq("status", "published");

  if (params.q)
    query = query.textSearch("search_tsv", params.q, { type: "websearch" });
  if (params.category) query = query.eq("categories.slug", params.category);
  if (params.brand) query = query.eq("brands.slug", params.brand);
  if (params.classification)
    query = query.eq("manufacturing_classification", params.classification);
  if (params.state) query = query.eq("manufacturing_state", params.state);
  if (params.price) {
    const band = PRICE_BANDS[params.price];
    if (band?.min !== undefined) query = query.gte("price_amount", band.min);
    if (band?.max !== undefined) query = query.lt("price_amount", band.max);
  }

  if (params.sort === "newest") {
    query = query.order("published_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (params.sort === "name") {
    query = query.order("name");
  } else if (params.sort === "price_asc") {
    query = query.order("price_amount", { ascending: true, nullsFirst: false });
  } else if (params.sort === "price_desc") {
    query = query.order("price_amount", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    query = query.order("is_featured", { ascending: false }).order("name");
  }

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`searchProducts failed: ${error.message}`);

  const items = ((data ?? []) as unknown as ProductListRow[]).map(
    toProductListItem,
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

export async function getRecentProducts(limit = 3): Promise<ProductListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`getRecentProducts failed: ${error.message}`);
  return ((data ?? []) as unknown as ProductListRow[]).map(toProductListItem);
}

/** Distinct manufacturing states of published products, for the filter. */
export async function getProductStates(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("manufacturing_state")
    .eq("status", "published")
    .not("manufacturing_state", "is", null);
  if (error) throw new Error(`getProductStates failed: ${error.message}`);
  return [...new Set(data.map((r) => r.manufacturing_state as string))].sort();
}

export interface ProductDetail {
  product: ProductRow;
  brand: { name: string; slug: string; verification_status: string };
  category: { name: string; slug: string } | null;
  evidence: EvidenceListItem[];
  related: ProductListItem[];
  alternatives: ProductListItem[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, brands!inner(name, slug, verification_status), categories(name, slug)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProductBySlug failed: ${error.message}`);
  if (!data) return null;

  const { brands: brand, categories: category, ...product } = data;

  const [evidenceRes, relatedRes, alternativesRes] = await Promise.all([
    supabase
      .from("public_evidence")
      .select("*")
      .eq("product_id", product.id)
      .order("last_verified_at", { ascending: false, nullsFirst: false }),
    // Same brand, other products.
    supabase
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .eq("status", "published")
      .eq("brand_id", product.brand_id)
      .neq("id", product.id)
      .limit(3),
    // American-made alternatives: same category, different brand.
    product.category_id
      ? supabase
          .from("products")
          .select(PRODUCT_LIST_SELECT)
          .eq("status", "published")
          .eq("category_id", product.category_id)
          .neq("brand_id", product.brand_id)
          .limit(3)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const res of [evidenceRes, relatedRes, alternativesRes]) {
    if (res.error)
      throw new Error(`getProductBySlug detail failed: ${res.error.message}`);
  }

  return {
    product: product as ProductRow,
    brand,
    category,
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
    related: ((relatedRes.data ?? []) as unknown as ProductListRow[]).map(
      toProductListItem,
    ),
    alternatives: (
      (alternativesRes.data ?? []) as unknown as ProductListRow[]
    ).map(toProductListItem),
  };
}
