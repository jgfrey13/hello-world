import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleListItem } from "@/lib/database/shapes";
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
