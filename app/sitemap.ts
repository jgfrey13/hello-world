import type { MetadataRoute } from "next";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { articleHref } from "@/lib/database/shapes";
import { brandIsIndexable, productIsIndexable } from "@/lib/seo/indexability";

export const dynamic = "force-dynamic";

/**
 * Sitemap of published, quality-gated content. Thin records stay out (same
 * threshold as their pages' noindex — see lib/seo/indexability.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/brands",
    "/products",
    "/categories",
    "/guides",
    "/methodology",
    "/about",
    "/pricing",
    "/submit",
    "/policies",
  ].map((path) => ({ url: `${base}${path}` }));

  try {
    const supabase = createSupabaseServiceClient();
    const [brands, products, categories, articles] = await Promise.all([
      supabase
        .from("brands")
        .select("slug, summary, full_description, updated_at")
        .eq("status", "published"),
      supabase
        .from("products")
        .select("slug, summary, updated_at")
        .eq("status", "published"),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("articles")
        .select("slug, article_type, updated_at")
        .eq("status", "published"),
    ]);

    return [
      ...staticPages,
      ...(brands.data ?? []).filter(brandIsIndexable).map((brand) => ({
        url: `${base}/brands/${brand.slug}`,
        lastModified: brand.updated_at,
      })),
      ...(products.data ?? []).filter(productIsIndexable).map((product) => ({
        url: `${base}/products/${product.slug}`,
        lastModified: product.updated_at,
      })),
      ...(categories.data ?? []).map((category) => ({
        url: `${base}/categories/${category.slug}`,
        lastModified: category.updated_at,
      })),
      ...(articles.data ?? []).map((article) => ({
        url: `${base}${articleHref({
          slug: article.slug,
          articleType: article.article_type,
        })}`,
        lastModified: article.updated_at,
      })),
    ];
  } catch {
    // Sitemap degrades to static pages when the database is unreachable.
    return staticPages;
  }
}
