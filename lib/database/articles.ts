import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleListItem, ProductListItem } from "@/lib/database/shapes";
import type { Database } from "@/lib/database/types";

type ArticleType = Database["public"]["Enums"]["article_type"];

export async function getPublishedArticles(options?: {
  type?: ArticleType;
  limit?: number;
}): Promise<ArticleListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, article_type, is_sponsored, is_demo, published_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (options?.type) query = query.eq("article_type", options.type);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`getPublishedArticles failed: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    articleType: a.article_type,
    isSponsored: a.is_sponsored,
    isDemo: a.is_demo,
    publishedAt: a.published_at,
  }));
}

/** Published guides/stories linked to a brand (for brand profiles). */
export async function getArticlesForBrand(
  brandId: string,
  limit = 3,
): Promise<ArticleListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, article_type, is_sponsored, is_demo, published_at, article_brands!inner(brand_id)",
    )
    .eq("status", "published")
    .eq("article_brands.brand_id", brandId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`getArticlesForBrand failed: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    articleType: a.article_type,
    isSponsored: a.is_sponsored,
    isDemo: a.is_demo,
    publishedAt: a.published_at,
  }));
}

export interface ArticleDetail {
  article: Database["public"]["Tables"]["articles"]["Row"];
  authorName: string | null;
  sponsorBrand: { name: string; slug: string } | null;
  linkedBrands: { name: string; slug: string }[];
  linkedProducts: {
    product: ProductListItem;
    editorialLabel: string | null;
    displayOrder: number;
  }[];
  related: ArticleListItem[];
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getArticleBySlug failed: ${error.message}`);
  if (!article) return null;

  const [authorRes, sponsorRes, brandsRes, productsRes, relatedRes] =
    await Promise.all([
      article.author_id
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", article.author_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      article.sponsor_brand_id
        ? supabase
            .from("brands")
            .select("name, slug")
            .eq("id", article.sponsor_brand_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("article_brands")
        .select("brands!inner(name, slug, status)")
        .eq("article_id", article.id),
      supabase
        .from("article_products")
        .select(
          "display_order, editorial_label, products!inner(id, slug, name, summary, price_amount, price_is_approximate, manufacturing_classification, is_sponsored, is_demo, status, brands!inner(name, slug), categories(name))",
        )
        .eq("article_id", article.id)
        .order("display_order"),
      supabase
        .from("articles")
        .select(
          "id, slug, title, excerpt, article_type, is_sponsored, is_demo, published_at",
        )
        .eq("status", "published")
        .eq("article_type", article.article_type)
        .neq("id", article.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3),
    ]);

  for (const res of [brandsRes, productsRes, relatedRes]) {
    if (res.error)
      throw new Error(`getArticleBySlug detail failed: ${res.error.message}`);
  }

  return {
    article,
    authorName: authorRes.data?.full_name ?? null,
    sponsorBrand: sponsorRes.data ?? null,
    linkedBrands: (brandsRes.data ?? [])
      .map((row) => row.brands)
      .filter((brand) => brand.status === "published")
      .map((brand) => ({ name: brand.name, slug: brand.slug })),
    linkedProducts: (productsRes.data ?? [])
      .filter((row) => row.products.status === "published")
      .map((row) => ({
        displayOrder: row.display_order,
        editorialLabel: row.editorial_label,
        product: {
          id: row.products.id,
          slug: row.products.slug,
          name: row.products.name,
          brandSlug: row.products.brands.slug,
          brandName: row.products.brands.name,
          category: row.products.categories?.name ?? null,
          summary: row.products.summary,
          priceAmount: row.products.price_amount,
          priceIsApproximate: row.products.price_is_approximate,
          classification: row.products.manufacturing_classification,
          isSponsored: row.products.is_sponsored,
          isDemo: row.products.is_demo,
        },
      })),
    related: (relatedRes.data ?? []).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      articleType: a.article_type,
      isSponsored: a.is_sponsored,
      isDemo: a.is_demo,
      publishedAt: a.published_at,
    })),
  };
}
