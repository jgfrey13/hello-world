import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { SearchBar } from "@/components/search/search-bar";
import { BrandCard } from "@/components/brands/brand-card";
import { EmptyState } from "@/components/ui/states";
import { demoBrands } from "@/lib/demo/content";

export const metadata: Metadata = {
  title: "American-Made Brand Directory",
  description:
    "Browse American-made consumer brands with evidence-backed manufacturing statuses.",
};

/**
 * Phase 1 shell: renders labeled demo content with URL-driven search.
 * Phase 3 replaces the demo source with lib/database queries plus the full
 * filter panel (category, status, state, price, verification) and pagination.
 */
export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const brands = query
    ? demoBrands.filter((brand) =>
        `${brand.name} ${brand.summary} ${brand.categories.join(" ")}`
          .toLowerCase()
          .includes(query),
      )
    : demoBrands;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Brand directory"
        description="American-made consumer brands, each with an evidence-backed manufacturing status."
      />
      <div className="mt-8 space-y-6">
        <SearchBar
          action="/brands"
          placeholder="Search brands…"
          defaultValue={q}
          label="Search brands"
          className="max-w-xl"
        />
        <DemoNotice />
        {brands.length === 0 ? (
          <EmptyState
            title="No brands match your search"
            description={`Nothing found for “${q}”. Try a different term or browse all brands.`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
