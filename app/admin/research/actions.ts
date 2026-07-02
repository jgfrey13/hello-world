"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { normalizeDomain } from "@/lib/ingestion/domains";
import { z } from "zod";

const sourceSchema = z.object({
  sourceUrl: z.string().trim().url().max(2048),
  candidateName: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  sourceNote: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(5000).optional(),
  ),
});

/** Add a research source (staff). Starts as 'discovered'. */
export async function addResearchSourceAction(formData: FormData) {
  const { user } = await requireRole("editor");
  const parsed = sourceSchema.safeParse({
    sourceUrl: formData.get("sourceUrl"),
    candidateName: formData.get("candidateName"),
    sourceNote: formData.get("sourceNote"),
  });
  if (!parsed.success) redirect("/admin/research?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ingestion_records").insert({
    source_url: parsed.data!.sourceUrl,
    candidate_name: parsed.data!.candidateName ?? null,
    source_note: parsed.data!.sourceNote ?? null,
    normalized_domain: normalizeDomain(parsed.data!.sourceUrl),
    created_by: user.id,
  });
  if (error) redirect("/admin/research?status=error");

  revalidatePath("/admin/research");
  redirect("/admin/research?status=saved");
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "discovered",
    "queued",
    "needs_review",
    "approved",
    "rejected",
    "failed",
  ]),
});

/** Manual pipeline transitions (staff). Automated stages come later. */
export async function setResearchStatusAction(formData: FormData) {
  await requireRole("editor");
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) redirect("/admin/research?status=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ingestion_records")
    .update({ status: parsed.data!.status })
    .eq("id", parsed.data!.id);
  if (error) redirect("/admin/research?status=error");

  revalidatePath("/admin/research");
  redirect("/admin/research?status=saved");
}
