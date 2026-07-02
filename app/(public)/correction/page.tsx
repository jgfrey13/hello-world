import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitCorrectionAction } from "@/app/(public)/correction/actions";

export const metadata: Metadata = {
  title: "Submit a Correction",
  description:
    "Spotted something wrong on MadeHere? Corrections go straight to our review queue — and are never suppressed for paying brands.",
};

export default async function CorrectionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Submit a correction"
        description="Accuracy is the product. If a manufacturing status, price, or any other detail looks wrong, tell us — every correction enters a review queue, and accurate corrections are never suppressed."
      />

      <div className="mt-8 space-y-6">
        <FormStatusBanner status={status} />

        <form
          action={submitCorrectionAction}
          className="space-y-5"
          aria-label="Submit a correction"
        >
          <HoneypotField />
          <div className="space-y-1.5">
            <Label htmlFor="page-url">Page with the issue</Label>
            <Input
              id="page-url"
              name="pageUrl"
              type="url"
              placeholder="https://"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="issue">What’s wrong?</Label>
            <Textarea
              id="issue"
              name="issueDescription"
              required
              maxLength={5000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proposed">What should it say instead?</Label>
            <Textarea
              id="proposed"
              name="proposedCorrection"
              maxLength={5000}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Supporting source</Label>
            <Input
              id="source"
              name="supportingSourceUrl"
              type="url"
              placeholder="https://"
            />
            <p className="text-muted-foreground text-xs">
              A link that supports the correction helps us verify it quickly.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correction-email">Your email</Label>
            <Input
              id="correction-email"
              name="submitterEmail"
              type="email"
              required
            />
            <p className="text-muted-foreground text-xs">
              Only used to follow up on this correction. Never shown publicly.
            </p>
          </div>
          <SubmitButton pendingLabel="Sending…">Send correction</SubmitButton>
        </form>
      </div>
    </div>
  );
}
