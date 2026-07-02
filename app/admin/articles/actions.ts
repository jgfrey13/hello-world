"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { articleUpsertSchema } from "@/lib/validation";
import { z } from "zod";

function articlePayload(formData: FormData) {
  return articleUpsertSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    articleType: formData.get("articleType"),
    isSponsored: formData.get("isSponsored"),
    sponsorBrandId: formData.get("sponsorBrandId"),
    affiliateDisclosureRequired: formData.get("affiliateDisclosureRequired"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
}

function toRow(input: z.infer<typeof articleUpsertSchema>, authorId: string) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt ?? null,
    body: input.body ?? null,
    article_type: input.articleType,
    is_sponsored: input.isSponsored,
    sponsor_brand_id: input.isSponsored ? (input.sponsorBrandId ?? null) : null,
    affiliate_disclosure_required: input.affiliateDisclosureRequired,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    author_id: authorId,
  };
}

export async function createArticleAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const parsed = articlePayload(formData);
  if (!parsed.success) redirect("/admin/articles/new?status=invalid");
  // DB check constraint also enforces: sponsored articles must name a sponsor.
  if (parsed.data!.isSponsored && !parsed.data!.sponsorBrandId) {
    redirect("/admin/articles/new?status=sponsor_required");
  }

  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("articles")
    .insert({ ...toRow(parsed.data!, user.id), status: "draft" })
    .select("id")
    .maybeSingle();
  if (error || !created) redirect("/admin/articles/new?status=error");

  await recordAudit({
    actor: user.id,
    action: "article_created",
    entity: "articles",
    entityId: created!.id,
    after: { slug: parsed.data!.slug },
  });

  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${created!.id}?status=saved`);
}

export async function updateArticleAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = articlePayload(formData);
  if (!id.success || !parsed.success)
    redirect("/admin/articles?status=invalid");
  if (parsed.data!.isSponsored && !parsed.data!.sponsorBrandId) {
    redirect(`/admin/articles/${id.data}?status=sponsor_required`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("author_id")
    .eq("id", id.data!)
    .maybeSingle();
  const { data: updated, error } = await supabase
    .from("articles")
    .update({
      ...toRow(parsed.data!, existing?.author_id ?? user.id),
    })
    .eq("id", id.data!)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/admin/articles/${id.data}?status=error`);
  if (!updated) redirect(`/admin/articles/${id.data}?status=forbidden`);

  await recordAudit({
    actor: user.id,
    action: "article_updated",
    entity: "articles",
    entityId: id.data!,
  });

  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${id.data}?status=saved`);
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

export async function setArticleStatusAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/admin/articles?status=invalid");
  const { id, status } = parsed.data!;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("articles")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("articles")
    .update({
      status,
      ...(status === "published" && !before?.published_at
        ? { published_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id);
  if (error) redirect(`/admin/articles/${id}?status=error`);

  await recordAudit({
    actor: user.id,
    action: `article_status_${status}`,
    entity: "articles",
    entityId: id,
    before: { status: before?.status },
    after: { status },
  });

  revalidatePath("/admin/articles");
  revalidatePath("/guides");
  redirect(`/admin/articles/${id}?status=saved`);
}
