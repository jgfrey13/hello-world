"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import {
  proposedBrandChangeSchema,
  proposedNewProductSchema,
  proposedProductChangeSchema,
} from "@/lib/validation";
import { z } from "zod";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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
    // Apply only whitelisted fields (schemas shared with the owner
    // submission forms); anything outside the whitelist makes the whole
    // proposal unapplyable — classification/status/evidence keys included.
    if (change!.change_type === "product_new" && change!.brand_id) {
      const payload = proposedNewProductSchema.safeParse(change!.proposed_data);
      if (!payload.success) redirect("/admin/changes?status=unapplyable");
      const baseSlug = slugify(payload.data!.name) || "product";
      let slug = baseSlug;
      for (let attempt = 2; attempt < 20; attempt++) {
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existing) break;
        slug = `${baseSlug}-${attempt}`;
      }
      const { error } = await supabase.from("products").insert({
        ...payload.data!,
        slug,
        brand_id: change!.brand_id,
        status: "draft", // editorial review + admin publish still required
      });
      if (error) redirect("/admin/changes?status=error");
    } else if (change!.brand_id && !change!.product_id) {
      const payload = proposedBrandChangeSchema.safeParse(
        change!.proposed_data,
      );
      if (!payload.success) redirect("/admin/changes?status=unapplyable");
      const { error } = await supabase
        .from("brands")
        .update(payload.data!)
        .eq("id", change!.brand_id);
      if (error) redirect("/admin/changes?status=error");
    } else if (change!.product_id) {
      const payload = proposedProductChangeSchema.safeParse(
        change!.proposed_data,
      );
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
