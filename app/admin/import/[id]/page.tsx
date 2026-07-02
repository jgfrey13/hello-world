import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import type { ValidatedImportRow } from "@/lib/ingestion/brands-import";
import {
  commitImportAction,
  discardImportAction,
} from "@/app/admin/import/actions";

export const metadata = { title: "Import Preview" };

export default async function ImportPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const [{ id }, { status }] = await Promise.all([params, searchParams]);

  const supabase = await createSupabaseServerClient();
  const { data: job } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const rows = job.rows as unknown as ValidatedImportRow[];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-bold">{job.filename}</h1>
        <Badge
          variant={job.status === "pending_review" ? "secondary" : "muted"}
        >
          {job.status}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        {job.valid_count} of {job.row_count} rows valid
        {job.status === "committed" && (
          <> — {job.committed_count} draft brands created</>
        )}
        . Rows with issues are skipped on commit.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {job.status === "pending_review" && (
        <div className="mt-4 flex gap-2">
          <form action={commitImportAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <ConfirmSubmitButton
              size="sm"
              confirmTitle={`Create ${job.valid_count} draft brands?`}
              confirmDescription="Valid rows become draft brands for editorial review. Nothing is published, and no manufacturing claims are created."
            >
              Commit valid rows
            </ConfirmSubmitButton>
          </form>
          <form action={discardImportAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button type="submit" size="sm" variant="outline">
              Discard
            </Button>
          </form>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-left">
              <th scope="col" className="px-4 py-2.5 font-medium">
                #
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Website
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t align-top">
                <td className="text-muted-foreground px-4 py-2.5">
                  {index + 1}
                </td>
                <td className="px-4 py-2.5">{row.data?.name ?? "—"}</td>
                <td className="text-muted-foreground px-4 py-2.5">
                  {row.data?.website_url ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  {row.ok ? (
                    <Badge>ok</Badge>
                  ) : (
                    <ul className="text-destructive space-y-0.5 text-xs">
                      {row.issues.map((issue, issueIndex) => (
                        <li key={issueIndex}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
