import { z } from "zod";
import { normalizeDomain } from "@/lib/ingestion/domains";

/**
 * Brand CSV row validation for the import preview. Pure: existing
 * domains/slugs are injected, so every rule is unit-testable. Imported rows
 * only ever become DRAFT brands — no manufacturing claims, no publishing.
 *
 * Expected columns: name, website_url, summary?, headquarters_city?,
 * headquarters_state?, founded_year?
 */

const rowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website_url: z.string().trim().url().max(2048),
  summary: z.string().trim().max(500).optional(),
  headquarters_city: z.string().trim().max(120).optional(),
  headquarters_state: z.string().trim().max(120).optional(),
  founded_year: z.coerce.number().int().min(1600).max(2100).optional(),
});

export interface ValidatedImportRow {
  data: {
    name: string;
    slug: string;
    website_url: string;
    summary: string | null;
    headquarters_city: string | null;
    headquarters_state: string | null;
    founded_year: number | null;
  } | null;
  issues: string[];
  ok: boolean;
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateBrandRows(
  records: Record<string, string>[],
  existing: { domains: Set<string>; slugs: Set<string> },
): ValidatedImportRow[] {
  const seenDomains = new Set<string>();
  const seenSlugs = new Set<string>();

  return records.map((record) => {
    const issues: string[] = [];
    const parsed = rowSchema.safeParse({
      ...record,
      summary: record.summary || undefined,
      headquarters_city: record.headquarters_city || undefined,
      headquarters_state: record.headquarters_state || undefined,
      founded_year: record.founded_year || undefined,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push(`${issue.path.join(".") || "row"}: ${issue.message}`);
      }
      return { data: null, issues, ok: false };
    }

    const domain = normalizeDomain(parsed.data.website_url);
    const slug = slugifyName(parsed.data.name);

    if (!domain) issues.push("website_url: unusable domain");
    if (!slug) issues.push("name: cannot derive a slug");
    if (domain && existing.domains.has(domain))
      issues.push(`duplicate: a brand with domain ${domain} already exists`);
    if (domain && seenDomains.has(domain))
      issues.push(`duplicate: domain ${domain} appears earlier in this file`);
    if (slug && (existing.slugs.has(slug) || seenSlugs.has(slug)))
      issues.push(`duplicate: slug ${slug} already in use`);

    if (domain) seenDomains.add(domain);
    if (slug) seenSlugs.add(slug);

    const ok = issues.length === 0;
    return {
      data: {
        name: parsed.data.name,
        slug,
        website_url: parsed.data.website_url,
        summary: parsed.data.summary ?? null,
        headquarters_city: parsed.data.headquarters_city ?? null,
        headquarters_state: parsed.data.headquarters_state ?? null,
        founded_year: parsed.data.founded_year ?? null,
      },
      issues,
      ok,
    };
  });
}
