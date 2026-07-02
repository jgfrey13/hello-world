"use server";

import { redirect } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { correctionSchema } from "@/lib/validation";
import { checkRateLimit, isSpamSubmission } from "@/lib/security/rate-limit";

export async function submitCorrectionAction(formData: FormData) {
  if (isSpamSubmission(formData)) redirect("/correction?status=received");

  const limit = await checkRateLimit("correction");
  if (!limit.allowed) redirect("/correction?status=rate_limited");

  const parsed = correctionSchema.safeParse({
    pageUrl: formData.get("pageUrl"),
    issueDescription: formData.get("issueDescription"),
    proposedCorrection: formData.get("proposedCorrection") || undefined,
    supportingSourceUrl: formData.get("supportingSourceUrl") || undefined,
    submitterEmail: formData.get("submitterEmail"),
  });
  if (!parsed.success) redirect("/correction?status=invalid");

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("corrections").insert({
    page_url: parsed.data!.pageUrl,
    issue_description: parsed.data!.issueDescription,
    proposed_correction: parsed.data!.proposedCorrection ?? null,
    supporting_source_url: parsed.data!.supportingSourceUrl ?? null,
    submitter_email: parsed.data!.submitterEmail,
  });
  if (error) redirect("/correction?status=error");

  redirect("/correction?status=received");
}
