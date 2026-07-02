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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Approving a submission creates a DRAFT brand for editorial work — it is
 * never published directly, and no manufacturing claim is created from the
 * submitter's say-so (evidence review does that).
 */
export async function reviewSubmissionAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = decisionSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) redirect("/admin/submissions?status=invalid");
  const { id, decision } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: submission } = await supabase
    .from("brand_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!submission || submission.status !== "pending") {
    redirect("/admin/submissions?status=error");
  }

  let createdBrandId: string | null = null;
  if (decision === "approved") {
    const baseSlug = slugify(submission!.brand_name) || "brand";
    // Avoid slug collisions with a numeric suffix.
    let slug = baseSlug;
    for (let attempt = 2; attempt < 20; attempt++) {
      const { data: existing } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${attempt}`;
    }

    const { data: created, error: createError } = await supabase
      .from("brands")
      .insert({
        name: submission!.brand_name,
        slug,
        website_url: submission!.website_url,
        summary: submission!.description,
        status: "draft",
      })
      .select("id")
      .maybeSingle();
    if (createError) redirect("/admin/submissions?status=error");
    createdBrandId = created?.id ?? null;
  }

  const { error } = await supabase
    .from("brand_submissions")
    .update({ status: decision })
    .eq("id", id);
  if (error) redirect("/admin/submissions?status=error");

  await recordAudit({
    actor: user.id,
    action: `submission_${decision}`,
    entity: "brand_submissions",
    entityId: id,
    after: { created_brand_id: createdBrandId },
  });

  revalidatePath("/admin/submissions");
  redirect(
    createdBrandId
      ? `/admin/brands/${createdBrandId}?status=saved`
      : "/admin/submissions?status=saved",
  );
}
