import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { FilterPanel } from "@/components/search/filter-panel";
import { ProductCard } from "@/components/products/product-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { searchProducts, getProductStates } from "@/lib/database/products";
import { getActiveCategories } from "@/lib/database/categories";
import { buildSearchHref, parseProductSearchParams } from "@/lib/search/params";

export const metadata: Metadata = {
  title: "American-Made Product Directory",
  description:
    "Search products manufactured in the United States, with sourcing evidence and honest classifications.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseProductSearchParams(await searchParams);
  const [results, categories, states] = await Promise.all([
    searchProducts(params),
    getActiveCategories(),
    getProductStates(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Product directory"
        description="Products classified at the product level — because a brand having some U.S.-made items doesn't make every item U.S.-made."
      />
      <div className="mt-8 space-y-6">
        <FilterPanel
          action="/products"
          categories={categories}
          states={states}
          values={params}
          priceOptions={[
            { value: 1, label: "Under $50" },
            { value: 2, label: "$50 – $150" },
            { value: 3, label: "Over $150" },
          ]}
          sortOptions={[
            { value: "relevance", label: "Featured" },
            { value: "name", label: "Name (A–Z)" },
            { value: "newest", label: "Recently published" },
            { value: "price_asc", label: "Price (low to high)" },
            { value: "price_desc", label: "Price (high to low)" },
          ]}
          searchLabel="Search products…"
        />
        {results.hasDemo && <DemoNotice />}
        <AffiliateDisclosure />
        {results.items.length === 0 ? (
          <EmptyState
            title="No products match"
            description={
              params.q
                ? `Nothing found for “${params.q}” with the selected filters. Try different terms or clear a filter.`
                : "No products match the selected filters yet."
            }
          />
        ) : (
          <>
            <h2 className="sr-only">Results</h2>
            <p className="text-muted-foreground text-sm" role="status">
              {results.total} product{results.total === 1 ? "" : "s"} found
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination
              currentPage={results.page}
              totalPages={results.totalPages}
              hrefForPage={(page) =>
                buildSearchHref("/products", { ...params, page })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
