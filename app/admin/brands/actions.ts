"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { brandUpsertSchema } from "@/lib/validation";
import { z } from "zod";

function brandPayload(formData: FormData) {
  return brandUpsertSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    legalName: formData.get("legalName"),
    summary: formData.get("summary"),
    fullDescription: formData.get("fullDescription"),
    websiteUrl: formData.get("websiteUrl"),
    foundedYear: formData.get("foundedYear"),
    founderNames: formData.get("founderNames"),
    headquartersCity: formData.get("headquartersCity"),
    headquartersState: formData.get("headquartersState"),
    priceLevel: formData.get("priceLevel"),
    isFeatured: formData.get("isFeatured"),
    isSponsored: formData.get("isSponsored"),
  });
}

function toRow(input: z.infer<typeof brandUpsertSchema>, isAdmin: boolean) {
  return {
    name: input.name,
    slug: input.slug,
    legal_name: input.legalName ?? null,
    summary: input.summary ?? null,
    full_description: input.fullDescription ?? null,
    website_url: input.websiteUrl ?? null,
    founded_year: input.foundedYear ?? null,
    founder_names: input.founderNames ?? null,
    headquarters_city: input.headquartersCity ?? null,
    headquarters_state: input.headquartersState ?? null,
    price_level: input.priceLevel ?? null,
    // Placement flags are admin-only (DB trigger enforces this too) — editor
    // saves simply never touch them.
    ...(isAdmin
      ? { is_featured: input.isFeatured, is_sponsored: input.isSponsored }
      : {}),
  };
}

async function syncCategories(brandId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const selected = formData
    .getAll("categoryIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  await supabase.from("brand_categories").delete().eq("brand_id", brandId);
  if (selected.length > 0) {
    await supabase.from("brand_categories").insert(
      selected.map((categoryId) => ({
        brand_id: brandId,
        category_id: categoryId,
      })),
    );
  }
}

export async function createBrandAction(formData: FormData) {
  const { user, profile } = await requireRole("editor");
  const parsed = brandPayload(formData);
  if (!parsed.success) redirect("/admin/brands/new?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("brands")
    .insert({
      ...toRow(parsed.data!, profile?.role === "admin"),
      status: "draft",
    })
    .select("id")
    .maybeSingle();
  if (error || !created) redirect("/admin/brands/new?status=error");

  await syncCategories(created!.id, formData);
  await recordAudit({
    actor: user.id,
    action: "brand_created",
    entity: "brands",
    entityId: created!.id,
    after: { name: parsed.data!.name, slug: parsed.data!.slug },
  });

  revalidatePath("/admin/brands");
  redirect(`/admin/brands/${created!.id}?status=saved`);
}

export async function updateBrandAction(formData: FormData) {
  const { user, profile } = await requireRole("editor");
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = brandPayload(formData);
  if (!id.success || !parsed.success) redirect("/admin/brands?status=invalid");

  const supabase = await createSupabaseServerClient();
  // RLS: editors can update only unpublished rows; admins anything.
  const { data: updated, error } = await supabase
    .from("brands")
    .update(toRow(parsed.data!, profile?.role === "admin"))
    .eq("id", id.data!)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/admin/brands/${id.data}?status=error`);
  if (!updated) redirect(`/admin/brands/${id.data}?status=forbidden`);

  await syncCategories(id.data!, formData);
  await recordAudit({
    actor: user.id,
    action: "brand_updated",
    entity: "brands",
    entityId: id.data!,
  });

  revalidatePath("/admin/brands");
  revalidatePath(`/brands/${parsed.data!.slug}`);
  redirect(`/admin/brands/${id.data}?status=saved`);
}

const statusChangeSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "draft",
    "pending_review",
    "published",
    "rejected",
    "archived",
  ]),
});

/** Publishing and archiving are admin-only (also enforced by RLS). */
export async function setBrandStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/admin/brands?status=invalid");
  const { id, status } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("brands")
    .select("status, published_at, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("brands")
    .update({
      status,
      ...(status === "published" && !before?.published_at
        ? { published_at: new Date().toISOString() }
        : {}),
      ...(status === "published"
        ? { last_reviewed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id);
  if (error) redirect(`/admin/brands/${id}?status=error`);

  await recordAudit({
    actor: user.id,
    action: `brand_status_${status}`,
    entity: "brands",
    entityId: id,
    before: { status: before?.status },
    after: { status },
  });

  revalidatePath("/admin/brands");
  if (before?.slug) revalidatePath(`/brands/${before.slug}`);
  redirect(`/admin/brands/${id}?status=saved`);
}

const verificationSchema = z.object({
  id: z.string().uuid(),
  verification: z.enum(["pending", "approved", "rejected"]),
});

/**
 * Brand verification status is an evidence outcome, set by admins after
 * review — independent of any subscription tier.
 */
export async function setBrandVerificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = verificationSchema.safeParse({
    id: formData.get("id"),
    verification: formData.get("verification"),
  });
  if (!parsed.success) redirect("/admin/brands?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("brands")
    .update({ verification_status: parsed.data!.verification })
    .eq("id", parsed.data!.id);
  if (error) redirect(`/admin/brands/${parsed.data!.id}?status=error`);

  await recordAudit({
    actor: user.id,
    action: `brand_verification_${parsed.data!.verification}`,
    entity: "brands",
    entityId: parsed.data!.id,
  });

  revalidatePath("/admin/brands");
  redirect(`/admin/brands/${parsed.data!.id}?status=saved`);
}
