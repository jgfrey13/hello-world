"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { brandSubmissionSchema } from "@/lib/validation";
import { checkRateLimit, isSpamSubmission } from "@/lib/security/rate-limit";
import { notifyAdmin } from "@/lib/email/notifications";
import { recordEvent } from "@/lib/analytics/events";

export async function submitBrandAction(formData: FormData) {
  // Spam trap: pretend success so bots learn nothing.
  if (isSpamSubmission(formData)) redirect("/submit?status=received");

  const limit = await checkRateLimit("brand_submission");
  if (!limit.allowed) redirect("/submit?status=rate_limited");

  const parsed = brandSubmissionSchema.safeParse({
    brandName: formData.get("brandName"),
    websiteUrl: formData.get("websiteUrl"),
    submitterName: formData.get("submitterName"),
    submitterEmail: formData.get("submitterEmail"),
    relationshipToBrand: formData.get("relationship") || undefined,
    categories: formData.get("category")
      ? [formData.get("category")]
      : undefined,
    description: formData.get("description") || undefined,
    manufacturingInformation:
      formData.get("manufacturingInformation") || undefined,
    evidenceUrl: formData.get("evidenceUrl") || undefined,
    comments: formData.get("comments") || undefined,
  });
  if (!parsed.success) redirect("/submit?status=invalid");

  // Service-role insert: the public has no direct write access to this
  // table (RLS), so the validated, rate-limited server path is the only
  // way in. Submissions land as pending admin-review records.
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("brand_submissions").insert({
    brand_name: parsed.data!.brandName,
    website_url: parsed.data!.websiteUrl,
    submitter_name: parsed.data!.submitterName,
    submitter_email: parsed.data!.submitterEmail,
    relationship_to_brand: parsed.data!.relationshipToBrand ?? null,
    categories: parsed.data!.categories ?? null,
    description: parsed.data!.description ?? null,
    manufacturing_information: parsed.data!.manufacturingInformation ?? null,
    evidence_url: parsed.data!.evidenceUrl ?? null,
    comments: parsed.data!.comments ?? null,
  });
  if (error) redirect("/submit?status=error");

  after(async () => {
    await notifyAdmin(
      "brand submission",
      `Brand: ${parsed.data!.brandName}\nWebsite: ${parsed.data!.websiteUrl}`,
    );
    await recordEvent({ type: "brand_submission", path: "/submit" });
  });

  redirect("/submit?status=received");
}
