import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { ProductCard } from "@/components/products/product-card";
import { BrandCard } from "@/components/brands/brand-card";
import { CategoryCard } from "@/components/categories/category-card";
import { EmptyState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryBySlug } from "@/lib/database/categories";
import { searchBrands } from "@/lib/database/brands";
import { searchProducts } from "@/lib/database/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `American-Made ${category.name}`,
    description:
      category.description ??
      `American-made ${category.name.toLowerCase()} with evidence-backed manufacturing claims.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, brands] = await Promise.all([
    searchProducts({ category: slug, sort: "relevance", page: 1 }),
    searchBrands({ category: slug, sort: "relevance", page: 1 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
        className="mb-6"
      />
      <PageHeader
        title={`American-made ${category.name.toLowerCase()}`}
        description={category.description ?? undefined}
      />

      {(products.hasDemo || brands.hasDemo) && (
        <div className="mt-6">
          <DemoNotice />
        </div>
      )}

      <section aria-labelledby="category-products" className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 id="category-products" className="font-serif text-2xl font-bold">
            Products
          </h2>
          <Link
            href={`/products?category=${category.slug}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            All {category.name.toLowerCase()} products
          </Link>
        </div>
        {products.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No products in this category yet"
              description="Know an American-made product that belongs here? Submit the brand."
              action={
                <Link
                  href="/submit"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Submit a brand
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-2">
              <AffiliateDisclosure />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.items.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>

      {brands.items.length > 0 && (
        <section aria-labelledby="category-brands" className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 id="category-brands" className="font-serif text-2xl font-bold">
              Brands
            </h2>
            <Link
              href={`/brands?category=${category.slug}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              All {category.name.toLowerCase()} brands
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {brands.items.slice(0, 3).map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        </section>
      )}

      {category.related.length > 0 && (
        <section aria-labelledby="category-related" className="mt-12">
          <h2 id="category-related" className="font-serif text-2xl font-bold">
            Related categories
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {category.related.map((item) => (
              <CategoryCard key={item.id} category={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
