import type { ManufacturingClassification } from "@/lib/verification/classification";

/**
 * Display shapes returned by lib/database query functions and consumed by
 * components. Components never see raw DB rows — these shapes are the
 * contract, so schema changes stay contained in this layer.
 */

export interface BrandListItem {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  state: string | null;
  priceLevel: number | null;
  categories: string[];
  isVerified: boolean;
  isSponsored: boolean;
  isDemo: boolean;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  category: string | null;
  summary: string | null;
  priceAmount: number | null;
  priceIsApproximate: boolean;
  classification: ManufacturingClassification;
  isSponsored: boolean;
  isDemo: boolean;
}

export interface CategoryListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  articleType: string;
  isSponsored: boolean;
  isDemo: boolean;
  publishedAt: string | null;
}

export interface EvidenceListItem {
  id: string;
  classification: ManufacturingClassification;
  sourceUrl: string | null;
  sourceTitle: string | null;
  evidenceNote: string | null;
  evidenceType: string;
  accessedAt: string | null;
  lastVerifiedAt: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  /** True when any returned row is fictional demo data (drives DemoNotice). */
  hasDemo: boolean;
}

/** Shopping guides live under /guides; other editorial under /articles. */
export function articleHref(
  article: Pick<ArticleListItem, "slug" | "articleType">,
): string {
  return article.articleType === "shopping_guide"
    ? `/guides/${article.slug}`
    : `/articles/${article.slug}`;
}

export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  shopping_guide: "Shopping guide",
  brand_story: "Brand story",
  founder_story: "Founder story",
  factory_story: "Factory story",
  comparison: "Comparison",
  buying_guide: "Buying guide",
  news: "News",
};

export function formatPrice(
  amount: number | null,
  approximate: boolean,
): string | null {
  if (amount === null) return null;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return approximate ? `≈ ${formatted}` : formatted;
}
