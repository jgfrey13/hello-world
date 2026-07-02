import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleView } from "@/components/articles/article-view";
import { getArticleBySlug } from "@/lib/database/articles";
import { articleHref } from "@/lib/database/shapes";
import { articleMetadata, articleJsonLd } from "@/lib/seo/article";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getArticleBySlug(slug);
  if (!detail) return {};
  return articleMetadata(detail, `/articles/${slug}`);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getArticleBySlug(slug);
  if (!detail) notFound();
  // Shopping guides live under /guides — keep one canonical URL.
  const canonical = articleHref({
    slug,
    articleType: detail.article.article_type,
  });
  if (canonical !== `/articles/${slug}`) permanentRedirect(canonical);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd(detail) }}
      />
      <ArticleView
        detail={detail}
        breadcrumbRoot={{ label: "Guides & stories", href: "/guides" }}
      />
    </>
  );
}
