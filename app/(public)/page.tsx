import Link from "next/link";
import { SearchBar } from "@/components/search/search-bar";
import { BrandCard } from "@/components/brands/brand-card";
import { ProductCard } from "@/components/products/product-card";
import { CategoryCard } from "@/components/categories/category-card";
import { GuideCard } from "@/components/articles/guide-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { buttonVariants } from "@/components/ui/button";
import {
  demoBrands,
  demoCategories,
  demoGuides,
  demoProducts,
} from "@/lib/demo/content";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Find products that are actually made here.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
          Research American-made brands, compare products, review sourcing
          evidence, and shop with greater confidence.
        </p>
        <SearchBar action="/products" className="mx-auto mt-8 max-w-xl" />
        <p className="text-muted-foreground mt-3 text-sm">
          Every manufacturing status links to the evidence behind it.{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            How we verify claims
          </Link>
        </p>
      </section>

      <DemoNotice />

      {/* Categories */}
      <section aria-labelledby="home-categories" className="py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="home-categories" className="font-serif text-2xl font-bold">
            Browse by category
          </h2>
          <Link
            href="/categories"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            All categories
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {demoCategories.slice(0, 4).map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      {/* Recently reviewed products */}
      <section aria-labelledby="home-products" className="py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="home-products" className="font-serif text-2xl font-bold">
            Recently reviewed products
          </h2>
          <Link
            href="/products"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            All products
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoProducts.slice(0, 3).map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* Featured brands */}
      <section aria-labelledby="home-brands" className="py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="home-brands" className="font-serif text-2xl font-bold">
            Featured brands
          </h2>
          <Link
            href="/brands"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            All brands
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoBrands.slice(0, 3).map((brand) => (
            <BrandCard key={brand.slug} brand={brand} />
          ))}
        </div>
      </section>

      {/* Guides */}
      <section aria-labelledby="home-guides" className="py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="home-guides" className="font-serif text-2xl font-bold">
            Shopping guides
          </h2>
          <Link
            href="/guides"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            All guides
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoGuides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </section>

      {/* Methodology intro */}
      <section
        aria-labelledby="home-methodology"
        className="bg-secondary my-12 rounded-lg border px-6 py-10 text-center sm:px-10"
      >
        <h2 id="home-methodology" className="font-serif text-2xl font-bold">
          Evidence first, always
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          We never infer “Made in USA” from a headquarters address, a founder’s
          nationality, or a flag in a logo. Every classification is backed by
          cited evidence with a review date — and paid placement can never
          change it.
        </p>
        <Link
          href="/methodology"
          className={`${buttonVariants({ variant: "outline" })} mt-6`}
        >
          Read our methodology
        </Link>
      </section>
    </div>
  );
}
