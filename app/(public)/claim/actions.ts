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

  // Optional proof-of-affiliation upload. User-scoped client: the storage
  // policy only permits writing under the caller's own {user_id}/ folder in
  // the private claim-proofs bucket (admin-read for review).
  let proofPath: string | null = null;
  const proof = formData.get("proof");
  if (proof instanceof File && proof.size > 0) {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);
    if (!allowed.has(proof.type) || proof.size > 10 * 1024 * 1024) {
      redirect("/claim?status=bad_file");
    }
    const extension =
      {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      }[proof.type] ?? "bin";
    proofPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("claim-proofs")
      .upload(proofPath, proof, { contentType: proof.type });
    if (uploadError) redirect("/claim?status=error");
  }

  const { error } = await supabase.from("brand_claims").insert({
    brand_id: parsed.data!.brandId,
    user_id: user.id,
    applicant_name: parsed.data!.applicantName,
    company_email: parsed.data!.companyEmail,
    job_title: parsed.data!.jobTitle ?? null,
    comments: parsed.data!.comments ?? null,
    proof_path: proofPath,
  });

  if (error) {
    // Unique partial index: one pending claim per user per brand.
    if (error.code === "23505") redirect("/claim?status=duplicate");
    redirect("/claim?status=error");
  }

  redirect("/claim?status=received");
}
