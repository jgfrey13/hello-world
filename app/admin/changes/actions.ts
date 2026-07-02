"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { z } from "zod";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

/**
 * Field whitelists for applying owner-proposed changes. Deliberately
 * excludes anything security- or classification-relevant: status,
 * manufacturing_classification, verification, evidence, billing, flags.
 */
const BRAND_APPLY_SCHEMA = z
  .object({
    summary: z.string().max(500).optional(),
    full_description: z.string().max(10000).optional(),
    website_url: z.string().url().max(2048).optional(),
    founder_names: z.string().max(500).optional(),
    founded_year: z.number().int().min(1600).max(2100).optional(),
    headquarters_city: z.string().max(120).optional(),
    headquarters_state: z.string().max(120).optional(),
  })
  .strict();

const PRODUCT_APPLY_SCHEMA = z
  .object({
    summary: z.string().max(500).optional(),
    description: z.string().max(10000).optional(),
    materials: z.string().max(1000).optional(),
    warranty_summary: z.string().max(1000).optional(),
    shipping_summary: z.string().max(1000).optional(),
    direct_purchase_url: z.string().url().max(2048).optional(),
    price_amount: z.number().min(0).max(1000000).optional(),
  })
  .strict();

export async function reviewProposedChangeAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) redirect("/admin/changes?status=invalid");
  const { id, decision } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: change } = await supabase
    .from("proposed_changes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!change || change.status !== "pending") {
    redirect("/admin/changes?status=error");
  }

  if (decision === "approved") {
    // Apply only whitelisted fields; anything outside the whitelist makes
    // the whole proposal unapplyable (strict schemas reject unknown keys).
    if (change!.brand_id && !change!.product_id) {
      const payload = BRAND_APPLY_SCHEMA.safeParse(change!.proposed_data);
      if (!payload.success) redirect("/admin/changes?status=unapplyable");
      const { error } = await supabase
        .from("brands")
        .update(payload.data!)
        .eq("id", change!.brand_id);
      if (error) redirect("/admin/changes?status=error");
    } else if (change!.product_id) {
      const payload = PRODUCT_APPLY_SCHEMA.safeParse(change!.proposed_data);
      if (!payload.success) redirect("/admin/changes?status=unapplyable");
      const { error } = await supabase
        .from("products")
        .update(payload.data!)
        .eq("id", change!.product_id);
      if (error) redirect("/admin/changes?status=error");
    }
  }

  const { error: statusError } = await supabase
    .from("proposed_changes")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (statusError) redirect("/admin/changes?status=error");

  await recordAudit({
    actor: user.id,
    action: `proposed_change_${decision}`,
    entity: "proposed_changes",
    entityId: id,
    after: {
      brand_id: change!.brand_id,
      product_id: change!.product_id,
      applied: decision === "approved",
    },
  });

  revalidatePath("/admin/changes");
  redirect("/admin/changes?status=saved");
}
