import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/states";
import { uploadImportAction } from "@/app/admin/import/actions";

export const metadata = { title: "CSV Import" };

const UPLOAD_ERRORS: Record<string, string> = {
  too_large: "File exceeds the 512 KB limit.",
  bad_header: "The CSV must include name and website_url columns.",
  empty: "The CSV contains no data rows.",
  too_many_rows: "Maximum 500 rows per import.",
};

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: jobs, error } = await supabase
    .from("import_jobs")
    .select(
      "id, filename, status, row_count, valid_count, committed_count, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`import jobs failed: ${error.message}`);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold">CSV import</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Brands only, with a validation preview before anything is written.
        Committed rows become <strong>drafts</strong> — never published records
        and never manufacturing claims.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status && UPLOAD_ERRORS[status] && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {UPLOAD_ERRORS[status]}
          </p>
        )}
      </div>

      <form
        action={uploadImportAction}
        className="mt-6 space-y-3 rounded-lg border p-4"
      >
        <Label htmlFor="import-file">
          Brands CSV (columns: name, website_url, summary, headquarters_city,
          headquarters_state, founded_year)
        </Label>
        <Input
          id="import-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
        />
        <Button type="submit">Upload &amp; preview</Button>
      </form>

      <h2 className="mt-8 font-serif text-lg font-semibold">Recent imports</h2>
      {(jobs ?? []).length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No imports yet" />
        </div>
      ) : (
        <ul className="mt-3 divide-y rounded-lg border">
          {(jobs ?? []).map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
            >
              <Link
                href={`/admin/import/${job.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {job.filename}
              </Link>
              <span className="text-muted-foreground flex items-center gap-2 text-xs">
                {job.valid_count}/{job.row_count} valid
                {job.status === "committed" && (
                  <> · {job.committed_count} committed</>
                )}
                <Badge
                  variant={
                    job.status === "pending_review" ? "secondary" : "muted"
                  }
                >
                  {job.status}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
