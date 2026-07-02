import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { reviewProposedChangeAction } from "@/app/admin/changes/actions";

export const metadata = { title: "Proposed Changes" };

export default async function AdminChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: changes, error } = await supabase
    .from("proposed_changes")
    .select("*, brands(name, slug), products(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`changes queue failed: ${error.message}`);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Proposed changes</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Brand-owner edits stay pending until approved here. Only descriptive
        fields can be applied — classification, status, and evidence fields are
        never owner-writable.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "unapplyable" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            This proposal contains fields outside the applyable whitelist and
            cannot be auto-applied. Apply valid parts manually, then reject it.
          </p>
        )}
      </div>

      {(changes ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No proposed changes awaiting review" />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(changes ?? []).map((change) => (
            <li key={change.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {change.products?.name ??
                  change.brands?.name ??
                  "Unknown target"}
                <span className="text-muted-foreground ml-2 text-xs">
                  {change.change_type}
                </span>
              </p>
              {change.rationale && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {change.rationale}
                </p>
              )}
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {JSON.stringify(change.proposed_data, null, 2)}
              </pre>
              {change.source_url && (
                <p className="mt-1 text-sm">
                  Source:{" "}
                  <a
                    href={change.source_url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="underline underline-offset-4"
                  >
                    {change.source_url}
                  </a>
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <form action={reviewProposedChangeAction}>
                  <input type="hidden" name="id" value={change.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <ConfirmSubmitButton
                    size="sm"
                    confirmTitle="Apply this change?"
                    confirmDescription="Whitelisted descriptive fields are written to the live record. Classification and status fields can never be changed this way."
                  >
                    Approve &amp; apply
                  </ConfirmSubmitButton>
                </form>
                <form action={reviewProposedChangeAction}>
                  <input type="hidden" name="id" value={change.id} />
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
