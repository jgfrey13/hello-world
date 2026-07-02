/**
 * Page-quality threshold for indexability (see .claude/rules + docs).
 * Thin records render fine but carry noindex and stay out of the sitemap —
 * we never mass-index low-information pages. Raise these thresholds as the
 * catalog matures; never lower them for volume.
 */

export function brandIsIndexable(brand: {
  summary: string | null;
  full_description: string | null;
}): boolean {
  const text = `${brand.summary ?? ""} ${brand.full_description ?? ""}`.trim();
  return text.length >= 40;
}

export function productIsIndexable(product: {
  summary: string | null;
}): boolean {
  return (product.summary ?? "").trim().length >= 20;
}
