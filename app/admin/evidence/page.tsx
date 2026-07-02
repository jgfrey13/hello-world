import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { EmptyState } from "@/components/ui/states";
import { reviewEvidenceAction } from "@/app/admin/evidence/actions";

export const metadata = { title: "Evidence Review" };

export default async function AdminEvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; filter?: string }>;
}) {
  const [{ status, filter }, current] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  const isAdmin = current?.profile?.role === "admin";
  const reviewFilter = filter === "all" ? undefined : "pending";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("manufacturing_evidence")
    .select(
      "id, classification, source_url, source_title, evidence_note, evidence_type, confidence_score, review_status, internal_notes, created_at, brands!inner(name, slug), products(name, slug)",
    )
    .order("created_at", { ascending: true })
    .limit(50);
  if (reviewFilter) query = query.eq("review_status", reviewFilter);
  const { data: rows, error } = await query;
  if (error) throw new Error(`evidence queue failed: ${error.message}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">Evidence review</h1>
        <div className="flex gap-2">
          <Link
            href={
              filter === "all"
                ? "/admin/evidence"
                : "/admin/evidence?filter=all"
            }
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {filter === "all" ? "Show pending only" : "Show all"}
          </Link>
          <Link
            href="/admin/evidence/new"
            className={buttonVariants({ size: "sm" })}
          >
            Add evidence
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <FormStatusBanner
          status={status === "needs_source" ? "invalid" : status}
        />
        {status === "needs_source" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Evidence cannot be approved without a source URL.
          </p>
        )}
      </div>

      {(rows ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No evidence awaiting review"
            description="New evidence records appear here when staff or brand owners submit them."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(rows ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ManufacturingStatusBadge classification={row.classification} />
                <Badge variant="muted">{row.review_status}</Badge>
                <span className="text-muted-foreground text-xs capitalize">
                  {row.evidence_type.replaceAll("_", " ")}
                </span>
                {row.confidence_score !== null && (
                  <span className="text-muted-foreground text-xs">
                    confidence {row.confidence_score}/100
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium">
                <Link
                  href={`/brands/${row.brands.slug}`}
                  className="underline underline-offset-4"
                >
                  {row.brands.name}
                </Link>
                {row.products && <> · {row.products.name}</>}
              </p>
              {row.evidence_note && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {row.evidence_note}
                </p>
              )}
              <p className="mt-1 text-sm">
                {row.source_url ? (
                  <a
                    href={row.source_url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-4"
                  >
                    {row.source_title ?? row.source_url}
                  </a>
                ) : (
                  <span className="text-destructive">No source URL</span>
                )}
              </p>
              {row.internal_notes && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Internal: {row.internal_notes}
                </p>
              )}
              {isAdmin && row.review_status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={reviewEvidenceAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <ConfirmSubmitButton
                      size="sm"
                      confirmTitle="Approve this evidence?"
                      confirmDescription="Approval records you as the reviewer and makes this record publicly visible with its source."
                    >
                      Approve
                    </ConfirmSubmitButton>
                  </form>
                  <form action={reviewEvidenceAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="needs_more_information"
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Needs more info
                    </Button>
                  </form>
                  <form action={reviewEvidenceAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      confirmTitle="Reject this evidence?"
                      confirmDescription="The record stays on file as rejected and never becomes public."
                    >
                      Reject
                    </ConfirmSubmitButton>
                  </form>
                </div>
              )}
              {!isAdmin && row.review_status === "pending" && (
                <p className="text-muted-foreground mt-3 text-xs">
                  Approval decisions are admin-only.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
