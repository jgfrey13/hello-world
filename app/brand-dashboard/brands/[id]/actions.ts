"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import {
  proposedBrandChangeSchema,
  proposedNewProductSchema,
} from "@/lib/validation";
import { z } from "zod";

const emptyToUndefined = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

async function requireOwnership(brandId: string) {
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();
  // RLS returns only the caller's own grants — no row means no access.
  const { data: grant } = await supabase
    .from("brand_owners")
    .select("brand_id")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (!grant) redirect("/brand-dashboard");
  return { user, supabase };
}

/**
 * Owner-proposed brand edit → pending proposed_changes row. RLS additionally
 * enforces own-brand + pending-only; the payload schema is shared with the
 * admin apply step, so whatever validates here is applyable there.
 */
export async function proposeBrandEditAction(formData: FormData) {
  const brandId = z.string().uuid().parse(formData.get("brandId"));
  const { user, supabase } = await requireOwnership(brandId);

  const payload = proposedBrandChangeSchema.safeParse(
    Object.fromEntries(
      Object.entries({
        summary: emptyToUndefined(formData.get("summary")),
        full_description: emptyToUndefined(formData.get("fullDescription")),
        website_url: emptyToUndefined(formData.get("websiteUrl")),
        founder_names: emptyToUndefined(formData.get("founderNames")),
        founded_year: emptyToUndefined(formData.get("foundedYear")),
        headquarters_city: emptyToUndefined(formData.get("headquartersCity")),
        headquarters_state: emptyToUndefined(formData.get("headquartersState")),
      }).filter(([, value]) => value !== undefined),
    ),
  );
  if (!payload.success) {
    redirect(`/brand-dashboard/brands/${brandId}?status=invalid`);
  }

  const { error } = await supabase.from("proposed_changes").insert({
    brand_id: brandId,
    submitted_by: user.id,
    change_type: "brand_update",
    proposed_data: payload.data!,
    rationale: emptyToUndefined(formData.get("rationale")) ?? null,
    source_url: emptyToUndefined(formData.get("sourceUrl")) ?? null,
  });
  if (error) redirect(`/brand-dashboard/brands/${brandId}?status=error`);

  revalidatePath(`/brand-dashboard/brands/${brandId}`);
  redirect(`/brand-dashboard/brands/${brandId}?status=received`);
}

/** Owner-proposed NEW product → pending proposed_changes (product_new). */
export async function proposeNewProductAction(formData: FormData) {
  const brandId = z.string().uuid().parse(formData.get("brandId"));
  const { user, supabase } = await requireOwnership(brandId);

  const payload = proposedNewProductSchema.safeParse(
    Object.fromEntries(
      Object.entries({
        name: emptyToUndefined(formData.get("name")),
        summary: emptyToUndefined(formData.get("summary")),
        description: emptyToUndefined(formData.get("description")),
        materials: emptyToUndefined(formData.get("materials")),
        price_amount: emptyToUndefined(formData.get("priceAmount")),
        direct_purchase_url: emptyToUndefined(
          formData.get("directPurchaseUrl"),
        ),
      }).filter(([, value]) => value !== undefined),
    ),
  );
  if (!payload.success) {
    redirect(`/brand-dashboard/brands/${brandId}?status=invalid`);
  }

  const { error } = await supabase.from("proposed_changes").insert({
    brand_id: brandId,
    submitted_by: user.id,
    change_type: "product_new",
    proposed_data: payload.data!,
    rationale: emptyToUndefined(formData.get("rationale")) ?? null,
    source_url: emptyToUndefined(formData.get("sourceUrl")) ?? null,
  });
  if (error) redirect(`/brand-dashboard/brands/${brandId}?status=error`);

  revalidatePath(`/brand-dashboard/brands/${brandId}`);
  redirect(`/brand-dashboard/brands/${brandId}?status=received`);
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // matches the bucket limit

/**
 * Owner media upload (logo/hero). Server-side MIME + size validation; the
 * object lands under the brand's folder in the public brand-media bucket and
 * the brand's media path is updated. Media only — never text/claims.
 */
export async function uploadBrandMediaAction(formData: FormData) {
  const brandId = z.string().uuid().parse(formData.get("brandId"));
  const kind = z.enum(["logo", "hero"]).parse(formData.get("kind"));
  const { user } = await requireOwnership(brandId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/brand-dashboard/brands/${brandId}?status=invalid`);
  }
  const upload = file as File;
  if (!ALLOWED_IMAGE_TYPES.has(upload.type) || upload.size > MAX_IMAGE_BYTES) {
    redirect(`/brand-dashboard/brands/${brandId}?status=bad_file`);
  }

  const extension =
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    }[upload.type] ?? "bin";
  const path = `brands/${brandId}/${kind}.${extension}`;

  // Service client after the explicit ownership check above: storage writes
  // to brand-media are staff/service-only by policy.
  const service = createSupabaseServiceClient();
  const { error: uploadError } = await service.storage
    .from("brand-media")
    .upload(path, upload, { upsert: true, contentType: upload.type });
  if (uploadError) {
    redirect(`/brand-dashboard/brands/${brandId}?status=error`);
  }

  const { error: updateError } = await service
    .from("brands")
    .update(kind === "logo" ? { logo_path: path } : { hero_image_path: path })
    .eq("id", brandId);
  if (updateError) redirect(`/brand-dashboard/brands/${brandId}?status=error`);

  await recordAudit({
    actor: user.id,
    action: `brand_media_${kind}_uploaded`,
    entity: "brands",
    entityId: brandId,
    after: { path },
  });

  revalidatePath(`/brand-dashboard/brands/${brandId}`);
  redirect(`/brand-dashboard/brands/${brandId}?status=saved`);
}
