import type { Metadata } from "next";
import type { ArticleDetail } from "@/lib/database/articles";

/**
 * Article SEO: metadata (editable via seo_title/seo_description columns),
 * canonical URL, Open Graph, and Article JSON-LD. Unpublished records are
 * always noindex.
 */

export function articleMetadata(
  detail: ArticleDetail,
  canonicalPath: string,
): Metadata {
  const { article } = detail;
  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? article.excerpt ?? undefined;
  const isPublished = article.status === "published";

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: isPublished ? undefined : { index: false },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      url: canonicalPath,
    },
  };
}

/**
 * JSON.stringify does not escape "</script>", so editor-controlled strings
 * could break out of a JSON-LD block. Escaping "<" closes that hole.
 */
export function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function articleJsonLd(detail: ArticleDetail): string {
  const { article, authorName } = detail;
  return jsonLdSafe({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.updated_at,
    author: authorName
      ? { "@type": "Person", name: authorName }
      : { "@type": "Organization", name: "MadeHere" },
    publisher: { "@type": "Organization", name: "MadeHere" },
    // Sponsored content is disclosed in structured data too.
    ...(article.is_sponsored
      ? {
          sponsor: {
            "@type": "Organization",
            name: detail.sponsorBrand?.name ?? "Sponsor",
          },
        }
      : {}),
  });
}
