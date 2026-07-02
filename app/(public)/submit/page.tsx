import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getActiveCategories } from "@/lib/database/categories";
import { submitBrandAction } from "@/app/(public)/submit/actions";

export const metadata: Metadata = {
  title: "Submit a Brand",
  description:
    "Suggest an American-made brand for the MadeHere directory. Every submission is reviewed against our evidence standard.",
};

export const dynamic = "force-dynamic";

export default async function SubmitBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, categories] = await Promise.all([
    searchParams,
    getActiveCategories(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Submit a brand"
        description="Know an American-made brand we should cover? Point us to the evidence and our team will review it — submissions are never published automatically."
      />

      <div className="mt-8 space-y-6">
        <FormStatusBanner status={status} />

        <form
          action={submitBrandAction}
          className="space-y-5"
          aria-label="Submit a brand"
        >
          <HoneypotField />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input
                id="brand-name"
                name="brandName"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-website">Brand website</Label>
              <Input
                id="brand-website"
                name="websiteUrl"
                type="url"
                placeholder="https://"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="submitter-name">Your name</Label>
              <Input
                id="submitter-name"
                name="submitterName"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="submitter-email">Your email</Label>
              <Input
                id="submitter-email"
                name="submitterEmail"
                type="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="relationship">Relationship to the brand</Label>
              <Select id="relationship" name="relationship">
                <option value="">Select…</option>
                <option value="customer">Customer / fan</option>
                <option value="owner">Owner or employee</option>
                <option value="agency">Agency / representative</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categories">Primary category</Label>
              <Select id="categories" name="category">
                <option value="">Select…</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">What does the brand make?</Label>
            <Textarea id="description" name="description" maxLength={5000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manufacturing-info">
              What do you know about where products are manufactured?
            </Label>
            <Textarea
              id="manufacturing-info"
              name="manufacturingInformation"
              maxLength={5000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evidence-url">
              Link supporting the manufacturing claim
            </Label>
            <Input
              id="evidence-url"
              name="evidenceUrl"
              type="url"
              placeholder="https://"
            />
            <p className="text-muted-foreground text-xs">
              A factory page, FAQ, press coverage — anything we can verify.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comments">Anything else? (optional)</Label>
            <Textarea id="comments" name="comments" maxLength={5000} />
          </div>
          <Button type="submit">Submit for review</Button>
          <p className="text-muted-foreground text-xs">
            By submitting you consent to us storing this information to review
            the brand. We never publish your contact details.
          </p>
        </form>
      </div>
    </div>
  );
}
