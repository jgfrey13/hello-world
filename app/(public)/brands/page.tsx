import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { FilterPanel } from "@/components/search/filter-panel";
import { BrandCard } from "@/components/brands/brand-card";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { searchBrands, getBrandStates } from "@/lib/database/brands";
import { getActiveCategories } from "@/lib/database/categories";
import { buildSearchHref, parseBrandSearchParams } from "@/lib/search/params";

export const metadata: Metadata = {
  title: "American-Made Brand Directory",
  description:
    "Browse American-made consumer brands with evidence-backed manufacturing statuses.",
};

// Rendered per request: results depend on query params and live data.
export const dynamic = "force-dynamic";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseBrandSearchParams(await searchParams);
  const [results, categories, states] = await Promise.all([
    searchBrands(params),
    getActiveCategories(),
    getBrandStates(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Brand directory"
        description="American-made consumer brands. Manufacturing is classified per product — open a brand to see the evidence behind its catalog."
      />
      <div className="mt-8 space-y-6">
        <FilterPanel
          action="/brands"
          categories={categories}
          states={states}
          values={params}
          priceOptions={[
            { value: 1, label: "$ — budget" },
            { value: 2, label: "$$ — mid-range" },
            { value: 3, label: "$$$ — premium" },
          ]}
          sortOptions={[
            { value: "relevance", label: "Featured" },
            { value: "name", label: "Name (A–Z)" },
            { value: "newest", label: "Recently published" },
          ]}
          searchLabel="Search brands…"
        />
        {results.hasDemo && <DemoNotice />}
        {results.items.length === 0 ? (
          <EmptyState
            title="No brands match"
            description={
              params.q
                ? `Nothing found for “${params.q}” with the selected filters. Try different terms or clear a filter.`
                : "No brands match the selected filters yet."
            }
          />
        ) : (
          <>
            <p className="text-muted-foreground text-sm" role="status">
              {results.total} brand{results.total === 1 ? "" : "s"} found
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
            <Pagination
              currentPage={results.page}
              totalPages={results.totalPages}
              hrefForPage={(page) =>
                buildSearchHref("/brands", { ...params, page })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
