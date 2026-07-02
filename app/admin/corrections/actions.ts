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
 * Corrections review. "Approved" means the correction was verified and the
 * underlying record has been (or is being) fixed via its edit form —
 * accurate corrections are never suppressed, for any brand.
 */
export async function reviewCorrectionAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) redirect("/admin/corrections?status=invalid");
  const { id, decision } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("corrections")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) redirect("/admin/corrections?status=error");

  await recordAudit({
    actor: user.id,
    action: `correction_${decision}`,
    entity: "corrections",
    entityId: id,
  });

  revalidatePath("/admin/corrections");
  redirect("/admin/corrections?status=saved");
}
