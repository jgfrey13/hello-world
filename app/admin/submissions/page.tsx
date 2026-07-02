import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { reviewSubmissionAction } from "@/app/admin/submissions/actions";

export const metadata = { title: "Brand Submissions" };

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: submissions, error } = await supabase
    .from("brand_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`submissions queue failed: ${error.message}`);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Brand submissions</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Approval creates a <strong>draft</strong> brand for editorial work —
        nothing is published or classified from a submission alone.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {(submissions ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No submissions awaiting review" />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(submissions ?? []).map((submission) => (
            <li key={submission.id} className="rounded-lg border p-4">
              <p className="font-medium">{submission.brand_name}</p>
              <p className="text-sm">
                <a
                  href={submission.website_url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="underline underline-offset-4"
                >
                  {submission.website_url}
                </a>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                From {submission.submitter_name} ({submission.submitter_email})
                {submission.relationship_to_brand && (
                  <> · {submission.relationship_to_brand}</>
                )}
              </p>
              {submission.description && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {submission.description}
                </p>
              )}
              {submission.manufacturing_information && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Manufacturing: {submission.manufacturing_information}
                </p>
              )}
              {submission.evidence_url && (
                <p className="mt-1 text-sm">
                  Evidence:{" "}
                  <a
                    href={submission.evidence_url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-4"
                  >
                    {submission.evidence_url}
                  </a>
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <form action={reviewSubmissionAction}>
                  <input type="hidden" name="id" value={submission.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <ConfirmSubmitButton
                    size="sm"
                    confirmTitle="Create a draft brand from this submission?"
                    confirmDescription="A draft brand record is created for editorial review. It will not be public until an admin publishes it."
                  >
                    Approve → draft brand
                  </ConfirmSubmitButton>
                </form>
                <form action={reviewSubmissionAction}>
                  <input type="hidden" name="id" value={submission.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
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
