import { z } from "zod";
import { MANUFACTURING_CLASSIFICATIONS } from "@/lib/verification/classification";

/**
 * Directory search/filter state lives in URL query params (shareable,
 * server-read). This module is the single parser for those params — pages
 * never read searchParams ad hoc.
 */

export const PAGE_SIZE = 12;

const pageSchema = z.coerce.number().int().min(1).max(10000).catch(1);

export const brandSearchParamsSchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  category: z.string().trim().max(100).optional().catch(undefined),
  classification: z
    .enum(MANUFACTURING_CLASSIFICATIONS)
    .optional()
    .catch(undefined),
  state: z.string().trim().max(100).optional().catch(undefined),
  price: z.coerce.number().int().min(1).max(3).optional().catch(undefined),
  sort: z.enum(["relevance", "name", "newest"]).catch("relevance"),
  page: pageSchema,
});
export type BrandSearchParams = z.infer<typeof brandSearchParamsSchema>;

export const productSearchParamsSchema = brandSearchParamsSchema.extend({
  brand: z.string().trim().max(200).optional().catch(undefined),
  sort: z
    .enum(["relevance", "name", "newest", "price_asc", "price_desc"])
    .catch("relevance"),
});
export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;

type RawParams = Record<string, string | string[] | undefined>;

export function parseBrandSearchParams(raw: RawParams): BrandSearchParams {
  return brandSearchParamsSchema.parse(raw);
}

export function parseProductSearchParams(raw: RawParams): ProductSearchParams {
  return productSearchParamsSchema.parse(raw);
}

/**
 * Rebuild a directory URL, preserving active filters. Used by pagination and
 * filter links so state stays shareable.
 */
export function buildSearchHref(
  basePath: string,
  params: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;
    // Defaults stay out of the URL.
    if (key === "page" && value === 1) continue;
    if (key === "sort" && value === "relevance") continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
