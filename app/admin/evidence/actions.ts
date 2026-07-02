"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { evidenceUpsertSchema } from "@/lib/validation";
import { z } from "zod";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "needs_more_information"]),
});

/**
 * Evidence review decisions are admin-only (also enforced by the DB trigger
 * and the approved-requires-source check constraint).
 */
export async function reviewEvidenceAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) redirect("/admin/evidence?status=invalid");
  const { id, decision } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("manufacturing_evidence")
    .select("review_status, source_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("manufacturing_evidence")
    .update({
      review_status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ...(decision === "approved"
        ? { last_verified_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id);

  if (error) {
    // Check constraint: approval without a source URL.
    if (error.message.includes("evidence_approved_requires_source")) {
      redirect("/admin/evidence?status=needs_source");
    }
    redirect("/admin/evidence?status=error");
  }

  await recordAudit({
    actor: user.id,
    action: `evidence_${decision}`,
    entity: "manufacturing_evidence",
    entityId: id,
    before: { review_status: before?.review_status },
    after: { review_status: decision },
  });

  revalidatePath("/admin/evidence");
  redirect("/admin/evidence?status=saved");
}

export async function createEvidenceAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const parsed = evidenceUpsertSchema.safeParse({
    brandId: formData.get("brandId"),
    productId: formData.get("productId"),
    classification: formData.get("classification"),
    sourceUrl: formData.get("sourceUrl"),
    sourceTitle: formData.get("sourceTitle"),
    evidenceNote: formData.get("evidenceNote"),
    evidenceType: formData.get("evidenceType"),
    confidenceScore: formData.get("confidenceScore"),
    internalNotes: formData.get("internalNotes"),
  });
  if (!parsed.success) redirect("/admin/evidence?status=invalid");
  const input = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("manufacturing_evidence").insert({
    brand_id: input.brandId,
    product_id: input.productId ?? null,
    classification: input.classification,
    source_url: input.sourceUrl ?? null,
    source_title: input.sourceTitle ?? null,
    evidence_note: input.evidenceNote ?? null,
    evidence_type: input.evidenceType,
    accessed_at: input.sourceUrl ? new Date().toISOString() : null,
    confidence_score: input.confidenceScore ?? null,
    internal_notes: input.internalNotes ?? null,
    review_status: "pending",
  });
  if (error) redirect("/admin/evidence?status=error");

  await recordAudit({
    actor: user.id,
    action: "evidence_created",
    entity: "manufacturing_evidence",
    after: { brand_id: input.brandId, classification: input.classification },
  });

  revalidatePath("/admin/evidence");
  redirect("/admin/evidence?status=saved");
}
