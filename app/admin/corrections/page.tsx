import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { reviewCorrectionAction } from "@/app/admin/corrections/actions";

export const metadata = { title: "Corrections" };

export default async function AdminCorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: corrections, error } = await supabase
    .from("corrections")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`corrections queue failed: ${error.message}`);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Corrections</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Verify against sources, fix the record via its edit form, then mark the
        correction. Accurate corrections are never suppressed.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {(corrections ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No corrections awaiting review" />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(corrections ?? []).map((correction) => (
            <li key={correction.id} className="rounded-lg border p-4">
              <p className="text-sm">
                <a
                  href={correction.page_url}
                  target="_blank"
                  rel="noopener"
                  className="font-medium underline underline-offset-4"
                >
                  {correction.page_url}
                </a>
              </p>
              <p className="mt-2 text-sm">{correction.issue_description}</p>
              {correction.proposed_correction && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Proposed: {correction.proposed_correction}
                </p>
              )}
              {correction.supporting_source_url && (
                <p className="mt-1 text-sm">
                  Source:{" "}
                  <a
                    href={correction.supporting_source_url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-4"
                  >
                    {correction.supporting_source_url}
                  </a>
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                Reporter: {correction.submitter_email} (never shown publicly)
              </p>
              <div className="mt-3 flex gap-2">
                <form action={reviewCorrectionAction}>
                  <input type="hidden" name="id" value={correction.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <ConfirmSubmitButton
                    size="sm"
                    confirmTitle="Mark this correction as verified and applied?"
                    confirmDescription="Confirm you have verified the issue against sources and updated the affected record."
                  >
                    Verified &amp; applied
                  </ConfirmSubmitButton>
                </form>
                <form action={reviewCorrectionAction}>
                  <input type="hidden" name="id" value={correction.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">
                    Not substantiated
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
