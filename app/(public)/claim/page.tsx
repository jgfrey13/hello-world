import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { FormPendingNotice } from "@/components/forms/form-pending-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Claim a Brand Profile",
  description:
    "Request management access to your brand's MadeHere profile. Claims require an account and are reviewed by our team.",
};

export default function ClaimProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Claim a brand profile"
        description="Work for a brand listed on MadeHere? Claim its profile to propose updates, add products, and view analytics. Claiming requires an account, proof of affiliation, and review by our team — access is never granted automatically."
      />

      <div className="mt-8 space-y-6">
        <FormPendingNotice activates="our accounts and review phase" />

        <form className="space-y-5" aria-label="Claim a profile (preview)">
          <fieldset disabled className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="claim-brand">Brand to claim</Label>
              <Input
                id="claim-brand"
                name="brand"
                placeholder="Search for the brand…"
                required
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="applicant-name">Your name</Label>
                <Input id="applicant-name" name="applicantName" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-title">Job title</Label>
                <Input id="job-title" name="jobTitle" required />
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
              <Label htmlFor="proof">Proof of affiliation</Label>
              <Input id="proof" name="proof" type="file" />
              <p className="text-muted-foreground text-xs">
                For example: a business card, letterhead, or dashboard
                screenshot. Never include passwords or payment details.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="claim-comments">Comments (optional)</Label>
              <Textarea id="claim-comments" name="comments" />
            </div>
            <Button type="submit">Request access</Button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
