import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordEvent } from "@/lib/analytics/events";
import { ShoppingCart } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";
import { DemoNotice } from "@/components/ui/demo-notice";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { EvidencePanel } from "@/components/brands/evidence-panel";
import { getProductBySlug } from "@/lib/database/products";
import { formatPrice } from "@/lib/database/shapes";
import { classificationLabel } from "@/lib/verification/classification";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProductBySlug(slug);
  if (!detail) return {};
  return {
    title: `${detail.product.name} by ${detail.brand.name}`,
    description:
      detail.product.summary ??
      `${detail.product.name} — ${classificationLabel(detail.product.manufacturing_classification)}.`,
    robots:
      detail.product.status === "published" ? undefined : { index: false },
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getProductBySlug(slug);
  if (!detail) notFound();

  const { product, brand, category, evidence, related, alternatives } = detail;

  if (product.status === "published") {
    after(() =>
      recordEvent({
        type: "product_view",
        brandId: product.brand_id,
        productId: product.id,
        path: `/products/${slug}`,
      }),
    );
  }
  const price = formatPrice(product.price_amount, product.price_is_approximate);
  const priceVerified = formatDate(product.price_verified_at);
  const lastReviewed = formatDate(product.last_reviewed_at);
  // Purchase clicks route through the tracked, destination-validated
  // /go/[slug] redirect (see app/go/[slug]/route.ts).
  const hasDestination = Boolean(
    product.affiliate_url ?? product.direct_purchase_url,
  );
  const purchaseUrl = hasDestination ? `/go/${product.slug}` : null;
  const manufacturingLocation = [
    product.manufacturing_city,
    product.manufacturing_state,
    product.manufacturing_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        className="mb-6"
      />

      {product.is_demo && (
        <div className="mb-6">
          <DemoNotice />
        </div>
      )}
      {product.status !== "published" && (
        <p className="border-destructive/40 text-destructive mb-6 rounded-md border px-4 py-2.5 text-sm">
          Unpublished {product.status} record — visible to staff only.
        </p>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <ManufacturingStatusBadge
                classification={product.manufacturing_classification}
              />
              {product.is_sponsored && <SponsoredBadge />}
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              by{" "}
              <Link
                href={`/brands/${brand.slug}`}
                className="text-foreground underline underline-offset-4"
              >
                {brand.name}
              </Link>
              {category && (
                <>
                  {" · "}
                  <Link
                    href={`/categories/${category.slug}`}
                    className="underline underline-offset-4"
                  >
                    {category.name}
                  </Link>
                </>
              )}
            </p>
          </header>

          {product.summary && (
            <p className="text-muted-foreground mt-6 text-lg">
              {product.summary}
            </p>
          )}
          {product.description && (
            <p className="text-muted-foreground mt-4 whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Manufacturing */}
          <section aria-labelledby="product-manufacturing" className="mt-10">
            <h2
              id="product-manufacturing"
              className="font-serif text-2xl font-bold"
            >
              Manufacturing
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium">Classification</dt>
                <dd className="text-muted-foreground mt-1">
                  {classificationLabel(product.manufacturing_classification)} —{" "}
                  <Link
                    href="/methodology"
                    className="underline underline-offset-4"
                  >
                    what this means
                  </Link>
                </dd>
              </div>
              {manufacturingLocation && (
                <div>
                  <dt className="font-medium">Location</dt>
                  <dd className="text-muted-foreground mt-1">
                    {manufacturingLocation}
                  </dd>
                </div>
              )}
              {product.materials && (
                <div>
                  <dt className="font-medium">Materials</dt>
                  <dd className="text-muted-foreground mt-1">
                    {product.materials}
                  </dd>
                </div>
              )}
              {product.imported_components_note && (
                <div>
                  <dt className="font-medium">Imported components</dt>
                  <dd className="text-muted-foreground mt-1">
                    {product.imported_components_note}
                  </dd>
                </div>
              )}
              {product.warranty_summary && (
                <div>
                  <dt className="font-medium">Warranty</dt>
                  <dd className="text-muted-foreground mt-1">
                    {product.warranty_summary}
                  </dd>
                </div>
              )}
              {product.shipping_summary && (
                <div>
                  <dt className="font-medium">Shipping</dt>
                  <dd className="text-muted-foreground mt-1">
                    {product.shipping_summary}
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-muted-foreground mt-4 text-xs">
              {lastReviewed
                ? `Last reviewed ${lastReviewed}. `
                : "Not yet fully reviewed. "}
              Something wrong?{" "}
              <Link href="/correction" className="underline underline-offset-4">
                Submit a correction
              </Link>
              .
            </p>
          </section>

          {/* Evidence */}
          <section aria-labelledby="product-evidence" className="mt-10">
            <h2 id="product-evidence" className="font-serif text-2xl font-bold">
              Evidence
            </h2>
            <EvidencePanel evidence={evidence} />
          </section>
        </div>

        {/* Purchase sidebar */}
        <aside aria-label="Purchase" className="lg:col-span-1">
          <div className="rounded-lg border p-5 lg:sticky lg:top-24">
            {price && (
              <p>
                <span className="font-serif text-3xl font-bold">{price}</span>
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              {priceVerified
                ? `Price checked ${priceVerified}.`
                : "Price not recently verified — confirm with the seller."}
            </p>
            {purchaseUrl ? (
              <>
                <a
                  href={purchaseUrl}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className={`${buttonVariants({ size: "lg" })} mt-4 w-full`}
                >
                  <ShoppingCart aria-hidden="true" />
                  Shop this product
                </a>
                <div className="mt-3">
                  {product.affiliate_url ? (
                    <AffiliateDisclosure />
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Direct link — we earn nothing from this purchase.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No purchase link on file. Check the brand’s website.
              </p>
            )}
            <div className="mt-4 border-t pt-4">
              <Badge variant="muted">
                {product.price_is_approximate
                  ? "Approximate price"
                  : "Listed price"}
              </Badge>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="product-related" className="mt-14">
          <h2 id="product-related" className="font-serif text-2xl font-bold">
            More from {brand.name}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {alternatives.length > 0 && (
        <section aria-labelledby="product-alternatives" className="mt-14">
          <h2
            id="product-alternatives"
            className="font-serif text-2xl font-bold"
          >
            American-made alternatives
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
