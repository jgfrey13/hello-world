import Link from "next/link";
import { notFound } from "next/navigation";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { getBrandAnalytics, getOwnedBrandDetail } from "@/lib/database/owner";
import type { ManufacturingClassification } from "@/lib/verification/classification";
import {
  proposeBrandEditAction,
  proposeNewProductAction,
  uploadBrandMediaAction,
} from "@/app/brand-dashboard/brands/[id]/actions";
import {
  openBillingPortalAction,
  startCheckoutAction,
} from "@/app/brand-dashboard/brands/[id]/billing-actions";
import { stripeConfigured } from "@/lib/stripe";

export const metadata = { title: "Manage Brand" };

export default async function OwnedBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status }] = await Promise.all([params, searchParams]);
  const detail = await getOwnedBrandDetail(id);
  if (!detail) notFound();
  const { brand, products, pendingChanges, subscription } = detail;
  const analytics = await getBrandAnalytics(brand.id);
  const billingEnabled = stripeConfigured();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-bold">{brand.name}</h1>
        <Badge variant={brand.status === "published" ? "default" : "muted"}>
          {brand.status}
        </Badge>
        <Link
          href={`/brands/${brand.slug}`}
          className="text-sm underline underline-offset-4"
        >
          View public page
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "bad_file" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Images must be JPEG, PNG, WebP, or AVIF and at most 5 MB.
          </p>
        )}
      </div>

      {/* Analytics */}
      <section aria-labelledby="bd-analytics" className="mt-8">
        <h2 id="bd-analytics" className="font-serif text-lg font-semibold">
          Last 30 days
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {[
            { label: "Profile views", value: analytics.profileViews30d },
            { label: "Product views", value: analytics.productViews30d },
            { label: "Outbound clicks", value: analytics.outboundClicks30d },
          ].map((metric) => (
            <Card key={metric.label}>
              <CardHeader>
                <CardTitle className="font-sans text-2xl">
                  {metric.value}
                </CardTitle>
                <CardDescription>{metric.label}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Real first-party counts. Outbound-click tracking activates with the
          affiliate-redirect phase.
        </p>
      </section>

      {/* Subscription */}
      <section aria-labelledby="bd-subscription" className="mt-8">
        <h2 id="bd-subscription" className="font-serif text-lg font-semibold">
          Subscription
        </h2>
        <div className="bg-secondary mt-3 rounded-lg border p-4 text-sm">
          <p>
            Current plan:{" "}
            <span className="font-medium capitalize">
              {brand.subscription_tier}
            </span>
            {subscription && (
              <span className="text-muted-foreground">
                {" "}
                ({subscription.status}
                {subscription.currentPeriodEnd &&
                  `, renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US")}`}
                )
              </span>
            )}
          </p>
          {billingEnabled ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {brand.subscription_tier !== "verified" && (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <input type="hidden" name="plan" value="verified" />
                  <Button type="submit" size="sm">
                    Upgrade to Verified
                  </Button>
                </form>
              )}
              {brand.subscription_tier !== "featured" && (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <input type="hidden" name="plan" value="featured" />
                  <Button type="submit" size="sm" variant="outline">
                    Upgrade to Featured
                  </Button>
                </form>
              )}
              {subscription && (
                <form action={openBillingPortalAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Manage billing
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground mt-1">
              Billing isn’t configured in this environment yet — see{" "}
              <Link href="/pricing" className="underline underline-offset-4">
                plans &amp; pricing
              </Link>{" "}
              for what each tier includes.
            </p>
          )}
          <p className="text-muted-foreground mt-2">
            A paid plan never changes manufacturing classifications, evidence
            review, or editorial decisions.
          </p>
        </div>
      </section>

      {/* Media */}
      <section aria-labelledby="bd-media" className="mt-8">
        <h2 id="bd-media" className="font-serif text-lg font-semibold">
          Brand media
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload imagery you are authorized to use. JPEG/PNG/WebP/AVIF, max 5
          MB.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {(["logo", "hero"] as const).map((kind) => (
            <form
              key={kind}
              action={uploadBrandMediaAction}
              className="space-y-3 rounded-lg border p-4"
            >
              <input type="hidden" name="brandId" value={brand.id} />
              <input type="hidden" name="kind" value={kind} />
              <Label htmlFor={`media-${kind}`}>
                {kind === "logo" ? "Logo" : "Hero image"}
              </Label>
              <p className="text-muted-foreground text-xs">
                {(kind === "logo" ? brand.logo_path : brand.hero_image_path)
                  ? `Current: ${kind === "logo" ? brand.logo_path : brand.hero_image_path}`
                  : "None uploaded yet."}
              </p>
              <Input
                id={`media-${kind}`}
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                required
              />
              <Button type="submit" size="sm" variant="outline">
                Upload {kind}
              </Button>
            </form>
          ))}
        </div>
      </section>

      {/* Products */}
      <section aria-labelledby="bd-products" className="mt-8">
        <h2 id="bd-products" className="font-serif text-lg font-semibold">
          Products
        </h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No products on file yet — propose one below.
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-lg border">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{product.name}</span>
                <span className="flex items-center gap-2">
                  <ManufacturingStatusBadge
                    classification={
                      product.classification as ManufacturingClassification
                    }
                  />
                  <Badge
                    variant={
                      product.status === "published" ? "default" : "muted"
                    }
                  >
                    {product.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          Manufacturing classifications are set by our review team based on
          evidence — submit sources via the edit form and they will be reviewed.
        </p>
      </section>

      {/* Propose brand edit */}
      <section aria-labelledby="bd-edit" className="mt-10">
        <h2 id="bd-edit" className="font-serif text-lg font-semibold">
          Propose a profile update
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill only the fields you want to change. Updates go to our review team
          and appear publicly once approved.
        </p>
        <form action={proposeBrandEditAction} className="mt-4 space-y-4">
          <input type="hidden" name="brandId" value={brand.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pe-website">Website</Label>
              <Input
                id="pe-website"
                name="websiteUrl"
                type="url"
                placeholder={brand.website_url ?? "https://"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-founded">Founded year</Label>
              <Input
                id="pe-founded"
                name="foundedYear"
                type="number"
                min={1600}
                max={2100}
                placeholder={brand.founded_year?.toString() ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-city">HQ city</Label>
              <Input
                id="pe-city"
                name="headquartersCity"
                placeholder={brand.headquarters_city ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-state">HQ state</Label>
              <Input
                id="pe-state"
                name="headquartersState"
                placeholder={brand.headquarters_state ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-summary">Summary</Label>
            <Textarea id="pe-summary" name="summary" maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-description">Full description</Label>
            <Textarea
              id="pe-description"
              name="fullDescription"
              rows={5}
              maxLength={10000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-founders">Founder names</Label>
            <Input id="pe-founders" name="founderNames" maxLength={500} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pe-rationale">Why this change?</Label>
              <Input id="pe-rationale" name="rationale" maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-source">Supporting link (optional)</Label>
              <Input
                id="pe-source"
                name="sourceUrl"
                type="url"
                placeholder="https://"
              />
            </div>
          </div>
          <Button type="submit">Submit for review</Button>
        </form>
      </section>

      {/* Propose new product */}
      <section aria-labelledby="bd-new-product" className="mt-10">
        <h2 id="bd-new-product" className="font-serif text-lg font-semibold">
          Submit a new product
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          New products start as drafts with classification “Awaiting Review”.
          Include manufacturing sources so our team can classify them.
        </p>
        <form action={proposeNewProductAction} className="mt-4 space-y-4">
          <input type="hidden" name="brandId" value={brand.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="np-name">Product name</Label>
              <Input id="np-name" name="name" required maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-price">Price (USD, approximate)</Label>
              <Input
                id="np-price"
                name="priceAmount"
                type="number"
                step="0.01"
                min={0}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="np-url">Product page URL</Label>
              <Input
                id="np-url"
                name="directPurchaseUrl"
                type="url"
                placeholder="https://"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-summary">Summary</Label>
            <Textarea id="np-summary" name="summary" maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-description">Description</Label>
            <Textarea
              id="np-description"
              name="description"
              rows={4}
              maxLength={10000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-materials">Materials</Label>
            <Input id="np-materials" name="materials" maxLength={1000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-source">
              Manufacturing evidence link (strongly encouraged)
            </Label>
            <Input
              id="np-source"
              name="sourceUrl"
              type="url"
              placeholder="https://"
            />
          </div>
          <Button type="submit">Submit for review</Button>
        </form>
      </section>

      {/* Recent submissions */}
      {pendingChanges.length > 0 && (
        <section aria-labelledby="bd-changes" className="mt-10">
          <h2 id="bd-changes" className="font-serif text-lg font-semibold">
            Your recent submissions
          </h2>
          <ul className="mt-3 divide-y rounded-lg border">
            {pendingChanges.map((change) => (
              <li
                key={change.id}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span className="capitalize">
                  {change.changeType.replaceAll("_", " ")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {new Date(change.createdAt).toLocaleDateString("en-US")}
                  </span>
                  <Badge
                    variant={
                      change.status === "approved"
                        ? "default"
                        : change.status === "rejected"
                          ? "outline"
                          : "muted"
                    }
                  >
                    {change.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
