"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { notifyClaimDecision } from "@/lib/email/notifications";
import { after } from "next/server";
import { z } from "zod";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

/**
 * Claim review is admin-only. Approval is the ONLY path that grants brand
 * access: it inserts a brand_owners row and upgrades the claimant's role to
 * brand_owner (both RLS-restricted to admins). Nothing is granted at claim
 * time.
 */
export async function reviewClaimAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) redirect("/admin/claims?status=invalid");
  const { id, decision } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: claim } = await supabase
    .from("brand_claims")
    .select("id, brand_id, user_id, status, company_email, brands!inner(name)")
    .eq("id", id)
    .maybeSingle();
  if (!claim || claim.status !== "pending") {
    redirect("/admin/claims?status=error");
  }

  const { error: updateError } = await supabase
    .from("brand_claims")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) redirect("/admin/claims?status=error");

  if (decision === "approved") {
    const { error: grantError } = await supabase.from("brand_owners").insert({
      brand_id: claim!.brand_id,
      user_id: claim!.user_id,
      granted_by: user.id,
    });
    // Duplicate grant (already an owner) is fine; anything else is not.
    if (grantError && grantError.code !== "23505") {
      redirect("/admin/claims?status=error");
    }
    // Upgrade the claimant's role so the brand dashboard opens for them.
    // Admin-only by RLS + trigger; visitors only ever move up to brand_owner.
    await supabase
      .from("profiles")
      .update({ role: "brand_owner" })
      .eq("user_id", claim!.user_id)
      .eq("role", "visitor");
  }

  await recordAudit({
    actor: user.id,
    action: `claim_${decision}`,
    entity: "brand_claims",
    entityId: id,
    after: { brand_id: claim!.brand_id, claimant: claim!.user_id },
  });

  const applicantEmail = claim!.company_email;
  const brandName = claim!.brands.name;
  after(() => notifyClaimDecision({ to: applicantEmail, brandName, decision }));

  revalidatePath("/admin/claims");
  redirect("/admin/claims?status=saved");
}
