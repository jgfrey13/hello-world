import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { SearchBar } from "@/components/search/search-bar";
import { ProductCard } from "@/components/products/product-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { EmptyState } from "@/components/ui/states";
import { demoProducts } from "@/lib/demo/content";

export const metadata: Metadata = {
  title: "American-Made Product Directory",
  description:
    "Search products manufactured in the United States, with sourcing evidence and honest classifications.",
};

/**
 * Phase 1 shell: labeled demo content with URL-driven search. Phase 3 swaps
 * in lib/database queries, full filters, and backend pagination.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const products = query
    ? demoProducts.filter((product) =>
        `${product.name} ${product.brandName} ${product.category} ${product.summary}`
          .toLowerCase()
          .includes(query),
      )
    : demoProducts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Product directory"
        description="Products classified at the product level — because a brand having some U.S.-made items doesn't make every item U.S.-made."
      />
      <div className="mt-8 space-y-6">
        <SearchBar
          action="/products"
          placeholder="Search products…"
          defaultValue={q}
          label="Search products"
          className="max-w-xl"
        />
        <DemoNotice />
        <AffiliateDisclosure />
        {products.length === 0 ? (
          <EmptyState
            title="No products match your search"
            description={`Nothing found for “${q}”. Try a different term or browse all products.`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
