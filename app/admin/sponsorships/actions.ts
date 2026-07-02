"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { sponsorshipUpsertSchema } from "@/lib/validation";
import { z } from "zod";

export async function createSponsorshipAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = sponsorshipUpsertSchema.safeParse({
    brandId: formData.get("brandId"),
    placementType: formData.get("placementType"),
    placementLocation: formData.get("placementLocation"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    disclosureText: formData.get("disclosureText"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) redirect("/admin/sponsorships?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsorships").insert({
    brand_id: parsed.data!.brandId,
    placement_type: parsed.data!.placementType,
    placement_location: parsed.data!.placementLocation ?? null,
    start_date: parsed.data!.startDate,
    end_date: parsed.data!.endDate ?? null,
    disclosure_text: parsed.data!.disclosureText ?? null,
    amount: parsed.data!.amount ?? null,
    status: "scheduled",
  });
  if (error) redirect("/admin/sponsorships?status=error");

  await recordAudit({
    actor: user.id,
    action: "sponsorship_created",
    entity: "sponsorships",
    after: {
      brand_id: parsed.data!.brandId,
      placement: parsed.data!.placementType,
    },
  });

  revalidatePath("/admin/sponsorships");
  redirect("/admin/sponsorships?status=saved");
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["scheduled", "active", "completed", "canceled"]),
});

export async function setSponsorshipStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/admin/sponsorships?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("sponsorships")
    .update({ status: parsed.data!.status })
    .eq("id", parsed.data!.id);
  if (error) redirect("/admin/sponsorships?status=error");

  await recordAudit({
    actor: user.id,
    action: `sponsorship_${parsed.data!.status}`,
    entity: "sponsorships",
    entityId: parsed.data!.id,
  });

  revalidatePath("/admin/sponsorships");
  redirect("/admin/sponsorships?status=saved");
}
