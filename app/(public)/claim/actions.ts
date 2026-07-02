"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brandClaimSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, isSpamSubmission } from "@/lib/security/rate-limit";

export async function submitClaimAction(formData: FormData) {
  // Authentication is required before anything else.
  const { user } = await requireUser();

  if (isSpamSubmission(formData)) redirect("/claim?status=received");

  const limit = await checkRateLimit("brand_claim");
  if (!limit.allowed) redirect("/claim?status=rate_limited");

  const parsed = brandClaimSchema.safeParse({
    brandId: formData.get("brandId"),
    applicantName: formData.get("applicantName"),
    companyEmail: formData.get("companyEmail"),
    jobTitle: formData.get("jobTitle") || undefined,
    comments: formData.get("comments") || undefined,
  });
  if (!parsed.success) redirect("/claim?status=invalid");

  // User-scoped client: RLS guarantees the claim is the user's own, starts
  // pending, and cannot be pre-approved. A claim grants no access by itself.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("brand_claims").insert({
    brand_id: parsed.data!.brandId,
    user_id: user.id,
    applicant_name: parsed.data!.applicantName,
    company_email: parsed.data!.companyEmail,
    job_title: parsed.data!.jobTitle ?? null,
    comments: parsed.data!.comments ?? null,
  });

  if (error) {
    // Unique partial index: one pending claim per user per brand.
    if (error.code === "23505") redirect("/claim?status=duplicate");
    redirect("/claim?status=error");
  }

  redirect("/claim?status=received");
}
