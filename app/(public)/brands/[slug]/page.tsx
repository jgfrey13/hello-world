import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { ProductCard } from "@/components/products/product-card";
import { GuideCard } from "@/components/articles/guide-card";
import { EvidencePanel } from "@/components/brands/evidence-panel";
import { getBrandBySlug } from "@/lib/database/brands";
import { getArticlesForBrand } from "@/lib/database/articles";
import {
  classificationLabel,
  MANUFACTURING_CLASSIFICATIONS,
} from "@/lib/verification/classification";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBrandBySlug(slug);
  if (!profile) return {};
  return {
    title: `${profile.brand.name} — American-Made Brand Profile`,
    description:
      profile.brand.summary ??
      `Manufacturing evidence and products for ${profile.brand.name}.`,
    robots: profile.brand.status === "published" ? undefined : { index: false },
  };
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BrandProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getBrandBySlug(slug);
  // RLS hides unpublished brands from the public; staff see them via the
  // same page. Anything not visible is a 404.
  if (!profile) notFound();

  const {
    brand,
    categories,
    locations,
    products,
    evidence,
    classificationCounts,
  } = profile;
  const guides = await getArticlesForBrand(brand.id);
  const lastReviewed = formatDate(brand.last_reviewed_at);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Brands", href: "/brands" },
          { label: brand.name },
        ]}
        className="mb-6"
      />

      {brand.is_demo && (
        <div className="mb-6">
          <DemoNotice />
        </div>
      )}
      {brand.status !== "published" && (
        <p className="border-destructive/40 text-destructive mb-6 rounded-md border px-4 py-2.5 text-sm">
          Unpublished {brand.status} record — visible to staff only.
        </p>
      )}

      {/* Header */}
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          {brand.verification_status === "approved" && <VerificationBadge />}
          {brand.is_sponsored && <SponsoredBadge />}
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {brand.name}
        </h1>
        {brand.summary && (
          <p className="text-muted-foreground mt-3 text-lg">{brand.summary}</p>
        )}
        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {(brand.headquarters_city || brand.headquarters_state) && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-3.5" />
              {[brand.headquarters_city, brand.headquarters_state]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
          {brand.founded_year && <span>Founded {brand.founded_year}</span>}
          {brand.website_url && (
            <a
              href={brand.website_url}
              rel="nofollow noopener"
              target="_blank"
              className="inline-flex items-center gap-1 underline underline-offset-4"
            >
              Website
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </div>
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                <Badge variant="muted">{category.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      {brand.full_description && (
        <section aria-labelledby="brand-about" className="mt-10 max-w-3xl">
          <h2 id="brand-about" className="font-serif text-2xl font-bold">
            About
          </h2>
          <p className="text-muted-foreground mt-3 whitespace-pre-line">
            {brand.full_description}
          </p>
        </section>
      )}

      {/* Manufacturing status — honest per-product aggregation */}
      <section aria-labelledby="brand-status" className="mt-10 max-w-3xl">
        <h2 id="brand-status" className="font-serif text-2xl font-bold">
          Manufacturing status
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          We classify manufacturing per product, not per brand. This catalog’s
          published products break down as:
        </p>
        {Object.keys(classificationCounts).length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No published products yet — no manufacturing claims are shown until
            products and their evidence are reviewed.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {MANUFACTURING_CLASSIFICATIONS.filter(
              (value) => classificationCounts[value],
            ).map((value) => (
              <li key={value} className="flex items-center gap-3 text-sm">
                <ManufacturingStatusBadge classification={value} />
                <span className="text-muted-foreground">
                  {classificationCounts[value]} product
                  {classificationCounts[value] === 1 ? "" : "s"}
                </span>
                <span className="sr-only">{classificationLabel(value)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground mt-4 text-xs">
          {lastReviewed
            ? `Last reviewed ${lastReviewed}. `
            : "Not yet fully reviewed. "}
          See{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            how we verify claims
          </Link>
          . Something wrong?{" "}
          <Link href="/correction" className="underline underline-offset-4">
            Submit a correction
          </Link>
          .
        </p>
      </section>

      {/* Evidence */}
      <section aria-labelledby="brand-evidence" className="mt-10 max-w-3xl">
        <h2 id="brand-evidence" className="font-serif text-2xl font-bold">
          Evidence
        </h2>
        <EvidencePanel evidence={evidence} />
      </section>

      {/* Locations */}
      {locations.length > 0 && (
        <section aria-labelledby="brand-locations" className="mt-10 max-w-3xl">
          <h2 id="brand-locations" className="font-serif text-2xl font-bold">
            Manufacturing locations
          </h2>
          <ul className="mt-4 space-y-2">
            {locations.map((location) => (
              <li
                key={location.id}
                className="text-muted-foreground flex items-center gap-2 text-sm"
              >
                <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                {[location.facilityName, location.city, location.state]
                  .filter(Boolean)
                  .join(", ")}
                <Badge variant="muted">{location.locationType}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Products */}
      <section aria-labelledby="brand-products" className="mt-10">
        <h2 id="brand-products" className="font-serif text-2xl font-bold">
          Products
        </h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No published products yet.
          </p>
        ) : (
          <>
            <div className="mt-2">
              <AffiliateDisclosure />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Related guides */}
      {guides.length > 0 && (
        <section aria-labelledby="brand-guides" className="mt-10">
          <h2 id="brand-guides" className="font-serif text-2xl font-bold">
            Related guides &amp; stories
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}

      {/* Claim */}
      <section className="bg-secondary mt-12 rounded-lg border p-6">
        <h2 className="font-serif text-lg font-bold">Work for this brand?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Claim this profile to propose updates, add products, and view
          analytics. Claims are reviewed by our team.
        </p>
        <Link
          href="/claim"
          className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
        >
          Claim this profile
        </Link>
      </section>
    </div>
  );
}
