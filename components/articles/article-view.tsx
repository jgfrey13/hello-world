import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/ui/demo-notice";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { SponsorDisclosure } from "@/components/articles/sponsor-disclosure";
import { ProductCard } from "@/components/products/product-card";
import { GuideCard } from "@/components/articles/guide-card";
import type { ArticleDetail } from "@/lib/database/articles";
import { ARTICLE_TYPE_LABELS } from "@/lib/database/shapes";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Shared renderer for all editorial article types. Body is stored as plain
 * text and rendered as paragraphs — never as raw HTML (no injection surface).
 */
export function ArticleView({
  detail,
  breadcrumbRoot,
}: {
  detail: ArticleDetail;
  breadcrumbRoot: { label: string; href: string };
}) {
  const {
    article,
    authorName,
    sponsorBrand,
    linkedBrands,
    linkedProducts,
    related,
  } = detail;
  const published = formatDate(article.published_at);
  const updated =
    article.updated_at !== article.created_at
      ? formatDate(article.updated_at)
      : null;
  const paragraphs = (article.body ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          breadcrumbRoot,
          { label: article.title },
        ]}
        className="mb-6"
      />

      {article.is_demo && (
        <div className="mb-6">
          <DemoNotice />
        </div>
      )}
      {article.status !== "published" && (
        <p className="border-destructive/40 text-destructive mb-6 rounded-md border px-4 py-2.5 text-sm">
          Unpublished {article.status} record — visible to staff only.
        </p>
      )}

      <div className="max-w-3xl">
        <Badge variant="muted">
          {ARTICLE_TYPE_LABELS[article.article_type] ?? article.article_type}
        </Badge>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-muted-foreground mt-3 text-lg">
            {article.excerpt}
          </p>
        )}
        <p className="text-muted-foreground mt-4 text-sm">
          {authorName && <>By {authorName} · </>}
          {published && <>Published {published}</>}
          {updated && <> · Updated {updated}</>}
        </p>

        <div className="mt-6 space-y-3">
          {article.is_sponsored && <SponsorDisclosure sponsor={sponsorBrand} />}
          {article.affiliate_disclosure_required && <AffiliateDisclosure />}
        </div>

        {paragraphs.length > 0 && (
          <div className="mt-8 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {linkedProducts.length > 0 && (
        <section aria-labelledby="article-products" className="mt-12">
          <h2 id="article-products" className="font-serif text-2xl font-bold">
            Products in this{" "}
            {ARTICLE_TYPE_LABELS[article.article_type]?.toLowerCase() ??
              "article"}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {linkedProducts.map(({ product, editorialLabel }) => (
              <div key={product.id} className="flex flex-col gap-2">
                {editorialLabel && (
                  <Badge className="self-start">{editorialLabel}</Badge>
                )}
                <div className="flex-1">
                  <ProductCard product={product} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {linkedBrands.length > 0 && (
        <section aria-labelledby="article-brands" className="mt-12 max-w-3xl">
          <h2 id="article-brands" className="font-serif text-xl font-bold">
            Brands mentioned
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {linkedBrands.map((brand) => (
              <li key={brand.slug}>
                <Link href={`/brands/${brand.slug}`}>
                  <Badge variant="secondary">{brand.name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="article-related" className="mt-12">
          <h2 id="article-related" className="font-serif text-2xl font-bold">
            Related reading
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <GuideCard key={item.id} guide={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
