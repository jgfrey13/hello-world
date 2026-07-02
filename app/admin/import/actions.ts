"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordAudit } from "@/lib/database/audit";
import { parseCsvRecords } from "@/lib/ingestion/csv";
import {
  validateBrandRows,
  type ValidatedImportRow,
} from "@/lib/ingestion/brands-import";
import { normalizeDomain } from "@/lib/ingestion/domains";
import { z } from "zod";

const MAX_CSV_BYTES = 512 * 1024;
const MAX_ROWS = 500;

/** Upload + validate a brands CSV into a pending import job (preview). */
export async function uploadImportAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import?status=invalid");
  }
  const upload = file as File;
  if (upload.size > MAX_CSV_BYTES) redirect("/admin/import?status=too_large");

  const text = await upload.text();
  const { header, records } = parseCsvRecords(text);
  if (!header.includes("name") || !header.includes("website_url")) {
    redirect("/admin/import?status=bad_header");
  }
  if (records.length === 0) redirect("/admin/import?status=empty");
  if (records.length > MAX_ROWS) redirect("/admin/import?status=too_many_rows");

  const supabase = await createSupabaseServerClient();
  const { data: existingBrands } = await supabase
    .from("brands")
    .select("slug, website_url");
  const existing = {
    domains: new Set(
      (existingBrands ?? [])
        .map((brand) => normalizeDomain(brand.website_url))
        .filter((domain): domain is string => Boolean(domain)),
    ),
    slugs: new Set((existingBrands ?? []).map((brand) => brand.slug)),
  };

  const rows = validateBrandRows(records, existing);
  const { data: job, error } = await supabase
    .from("import_jobs")
    .insert({
      filename: upload.name,
      entity: "brands",
      row_count: rows.length,
      valid_count: rows.filter((row) => row.ok).length,
      rows: rows as unknown as import("@/lib/database/types").Json,
      created_by: user.id,
    })
    .select("id")
    .maybeSingle();
  if (error || !job) redirect("/admin/import?status=error");

  redirect(`/admin/import/${job!.id}`);
}

/** Commit a previewed job: valid rows become DRAFT brands; invalid skipped. */
export async function commitImportAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = z.string().uuid().parse(formData.get("jobId"));

  const supabase = await createSupabaseServerClient();
  const { data: job } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.status !== "pending_review") {
    redirect("/admin/import?status=error");
  }

  const rows = (job!.rows as unknown as ValidatedImportRow[]).filter(
    (row) => row.ok && row.data,
  );
  let committed = 0;
  for (const row of rows) {
    // Draft only; never published, never classified, from an import.
    const { error } = await supabase.from("brands").insert({
      name: row.data!.name,
      slug: row.data!.slug,
      website_url: row.data!.website_url,
      summary: row.data!.summary,
      headquarters_city: row.data!.headquarters_city,
      headquarters_state: row.data!.headquarters_state,
      founded_year: row.data!.founded_year,
      status: "draft",
    });
    if (!error) committed++;
    // Collisions created between preview and commit are skipped, not fatal.
  }

  const { error: jobError } = await supabase
    .from("import_jobs")
    .update({
      status: "committed",
      committed_count: committed,
      committed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  if (jobError) redirect(`/admin/import/${jobId}?status=error`);

  await recordAudit({
    actor: user.id,
    action: "import_committed",
    entity: "import_jobs",
    entityId: jobId,
    after: { committed, of: rows.length },
  });

  revalidatePath("/admin/import");
  revalidatePath("/admin/brands");
  redirect(`/admin/import/${jobId}?status=saved`);
}

export async function discardImportAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = z.string().uuid().parse(formData.get("jobId"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("import_jobs")
    .update({ status: "discarded" })
    .eq("id", jobId)
    .eq("status", "pending_review");
  if (error) redirect(`/admin/import/${jobId}?status=error`);

  await recordAudit({
    actor: user.id,
    action: "import_discarded",
    entity: "import_jobs",
    entityId: jobId,
  });

  revalidatePath("/admin/import");
  redirect("/admin/import?status=saved");
}
