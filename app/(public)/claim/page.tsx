import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth";
import { getClaimableBrands } from "@/lib/database/brands";
import { submitClaimAction } from "@/app/(public)/claim/actions";

export const metadata: Metadata = {
  title: "Claim a Brand Profile",
  description:
    "Request management access to your brand's MadeHere profile. Claims require an account and are reviewed by our team.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ClaimProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string }>;
}) {
  const [{ status, brand: preselectedBrand }, current] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <PageHeader
          title="Claim a brand profile"
          description="Claiming a profile requires an account so we can review your affiliation and grant access to the right person."
        />
        <div className="mt-8 flex gap-3">
          <Link href="/auth/login?next=/claim" className={buttonVariants()}>
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className={buttonVariants({ variant: "outline" })}
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  const brands = await getClaimableBrands();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Claim a brand profile"
        description="Work for a brand listed on MadeHere? Claim its profile to propose updates, add products, and view analytics. Claims are reviewed by our team — access is never granted automatically."
      />

      <div className="mt-8 space-y-6">
        <FormStatusBanner status={status} />
        {status === "bad_file" && (
          <p role="alert" className="text-destructive text-sm">
            Proof files must be JPEG, PNG, WebP, or PDF and at most 10 MB.
          </p>
        )}

        <form
          action={submitClaimAction}
          className="space-y-5"
          aria-label="Claim a profile"
        >
          <HoneypotField />
          <div className="space-y-1.5">
            <Label htmlFor="claim-brand">Brand to claim</Label>
            <Select
              id="claim-brand"
              name="brandId"
              required
              defaultValue={
                brands.find((b) => b.slug === preselectedBrand)?.id ?? ""
              }
            >
              <option value="">Select the brand…</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="applicant-name">Your name</Label>
              <Input
                id="applicant-name"
                name="applicantName"
                required
                maxLength={200}
                defaultValue={current.profile?.full_name ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-title">Job title</Label>
              <Input id="job-title" name="jobTitle" maxLength={200} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-email">Company email address</Label>
            <Input
              id="company-email"
              name="companyEmail"
              type="email"
              required
            />
            <p className="text-muted-foreground text-xs">
              An address at the brand’s own domain speeds up review.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-comments">
              How are you affiliated with this brand?
            </Label>
            <Textarea id="claim-comments" name="comments" maxLength={5000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-proof">Proof of affiliation (optional)</Label>
            <Input
              id="claim-proof"
              name="proof"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
            />
            <p className="text-muted-foreground text-xs">
              A business card, letterhead, or dashboard screenshot
              (JPEG/PNG/WebP/PDF, max 10 MB). Stored privately, visible only to
              you and our review team. Never include passwords or payment
              details.
            </p>
          </div>
          <Button type="submit">Request access</Button>
        </form>
      </div>
    </div>
  );
}
