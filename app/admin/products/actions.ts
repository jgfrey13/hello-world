"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { productUpsertSchema } from "@/lib/validation";
import { MANUFACTURING_CLASSIFICATIONS } from "@/lib/verification/classification";
import { z } from "zod";

function productPayload(formData: FormData) {
  return productUpsertSchema.safeParse({
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    priceAmount: formData.get("priceAmount"),
    priceIsApproximate: formData.get("priceIsApproximate"),
    directPurchaseUrl: formData.get("directPurchaseUrl"),
    affiliateUrl: formData.get("affiliateUrl"),
    affiliateNetwork: formData.get("affiliateNetwork"),
    manufacturingCity: formData.get("manufacturingCity"),
    manufacturingState: formData.get("manufacturingState"),
    manufacturingCountry: formData.get("manufacturingCountry"),
    materials: formData.get("materials"),
    importedComponentsNote: formData.get("importedComponentsNote"),
    warrantySummary: formData.get("warrantySummary"),
    shippingSummary: formData.get("shippingSummary"),
    isFeatured: formData.get("isFeatured"),
    isSponsored: formData.get("isSponsored"),
  });
}

function toRow(input: z.infer<typeof productUpsertSchema>) {
  return {
    brand_id: input.brandId,
    category_id: input.categoryId ?? null,
    name: input.name,
    slug: input.slug,
    summary: input.summary ?? null,
    description: input.description ?? null,
    price_amount: input.priceAmount ?? null,
    price_is_approximate: input.priceIsApproximate,
    ...(input.priceAmount !== undefined
      ? { price_verified_at: new Date().toISOString() }
      : {}),
    direct_purchase_url: input.directPurchaseUrl ?? null,
    affiliate_url: input.affiliateUrl ?? null,
    affiliate_network: input.affiliateNetwork ?? null,
    manufacturing_city: input.manufacturingCity ?? null,
    manufacturing_state: input.manufacturingState ?? null,
    manufacturing_country: input.manufacturingCountry ?? null,
    materials: input.materials ?? null,
    imported_components_note: input.importedComponentsNote ?? null,
    warranty_summary: input.warrantySummary ?? null,
    shipping_summary: input.shippingSummary ?? null,
    is_featured: input.isFeatured,
    is_sponsored: input.isSponsored,
  };
}

export async function createProductAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const parsed = productPayload(formData);
  if (!parsed.success) redirect("/admin/products/new?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("products")
    .insert({ ...toRow(parsed.data!), status: "draft" })
    .select("id")
    .maybeSingle();
  if (error || !created) redirect("/admin/products/new?status=error");

  await recordAudit({
    actor: user.id,
    action: "product_created",
    entity: "products",
    entityId: created!.id,
    after: { name: parsed.data!.name },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created!.id}?status=saved`);
}

export async function updateProductAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = productPayload(formData);
  if (!id.success || !parsed.success)
    redirect("/admin/products?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("products")
    .update(toRow(parsed.data!))
    .eq("id", id.data!)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/admin/products/${id.data}?status=error`);
  if (!updated) redirect(`/admin/products/${id.data}?status=forbidden`);

  await recordAudit({
    actor: user.id,
    action: "product_updated",
    entity: "products",
    entityId: id.data!,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${parsed.data!.slug}`);
  redirect(`/admin/products/${id.data}?status=saved`);
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

export async function setProductStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/admin/products?status=invalid");
  const { id, status } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("products")
    .select("status, published_at, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
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
  if (error) redirect(`/admin/products/${id}?status=error`);

  await recordAudit({
    actor: user.id,
    action: `product_status_${status}`,
    entity: "products",
    entityId: id,
    before: { status: before?.status },
    after: { status },
  });

  revalidatePath("/admin/products");
  if (before?.slug) revalidatePath(`/products/${before.slug}`);
  redirect(`/admin/products/${id}?status=saved`);
}

const classificationSchema = z.object({
  id: z.string().uuid(),
  classification: z.enum(MANUFACTURING_CLASSIFICATIONS),
});

/**
 * Classification changes are admin-only and enforced again by the database
 * trigger. Set it only in line with reviewed evidence.
 */
export async function setProductClassificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = classificationSchema.safeParse({
    id: formData.get("id"),
    classification: formData.get("classification"),
  });
  if (!parsed.success) redirect("/admin/products?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("products")
    .select("manufacturing_classification")
    .eq("id", parsed.data!.id)
    .maybeSingle();

  const { error } = await supabase
    .from("products")
    .update({
      manufacturing_classification: parsed.data!.classification,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data!.id);
  if (error) redirect(`/admin/products/${parsed.data!.id}?status=error`);

  await recordAudit({
    actor: user.id,
    action: "product_classification_changed",
    entity: "products",
    entityId: parsed.data!.id,
    before: { classification: before?.manufacturing_classification },
    after: { classification: parsed.data!.classification },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${parsed.data!.id}?status=saved`);
}
