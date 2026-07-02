"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { categoryUpsertSchema } from "@/lib/validation";
import { z } from "zod";

export async function upsertCategoryAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const id = formData.get("id");
  const parsed = categoryUpsertSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    displayOrder: formData.get("displayOrder"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) redirect("/admin/categories?status=invalid");

  const row = {
    name: parsed.data!.name,
    slug: parsed.data!.slug,
    description: parsed.data!.description ?? null,
    display_order: parsed.data!.displayOrder ?? 0,
    is_active: parsed.data!.isActive,
  };

  const supabase = await createSupabaseServerClient();
  if (typeof id === "string" && id) {
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) redirect("/admin/categories?status=invalid");
    const { error } = await supabase
      .from("categories")
      .update(row)
      .eq("id", parsedId.data!);
    if (error) redirect("/admin/categories?status=error");
    await recordAudit({
      actor: user.id,
      action: "category_updated",
      entity: "categories",
      entityId: parsedId.data!,
    });
  } else {
    const { error } = await supabase.from("categories").insert(row);
    if (error) redirect("/admin/categories?status=error");
    await recordAudit({
      actor: user.id,
      action: "category_created",
      entity: "categories",
      after: { slug: row.slug },
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  redirect("/admin/categories?status=saved");
}
