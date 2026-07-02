import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { reviewClaimAction } from "@/app/admin/claims/actions";

export const metadata = { title: "Profile Claims" };

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: claims, error } = await supabase
    .from("brand_claims")
    .select(
      "id, applicant_name, company_email, job_title, comments, status, created_at, brands!inner(name, slug)",
    )
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`claims queue failed: ${error.message}`);

  const pending = (claims ?? []).filter((claim) => claim.status === "pending");
  const decided = (claims ?? []).filter((claim) => claim.status !== "pending");

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Profile claims</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Approval grants brand-management access and is the only path that does.
        Verify affiliation before approving.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {pending.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No claims awaiting review" />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {pending.map((claim) => (
            <li key={claim.id} className="rounded-lg border p-4">
              <p className="font-medium">
                <Link
                  href={`/brands/${claim.brands.slug}`}
                  className="underline underline-offset-4"
                >
                  {claim.brands.name}
                </Link>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {claim.applicant_name}
                {claim.job_title && <> · {claim.job_title}</>} ·{" "}
                {claim.company_email}
              </p>
              {claim.comments && (
                <p className="text-muted-foreground mt-2 text-sm">
                  “{claim.comments}”
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <form action={reviewClaimAction}>
                  <input type="hidden" name="id" value={claim.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <ConfirmSubmitButton
                    size="sm"
                    confirmTitle="Approve this claim?"
                    confirmDescription="The applicant gains brand-owner access to this brand's dashboard and submission workflows."
                  >
                    Approve access
                  </ConfirmSubmitButton>
                </form>
                <form action={reviewClaimAction}>
                  <input type="hidden" name="id" value={claim.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <ConfirmSubmitButton
                    size="sm"
                    variant="destructive"
                    confirmTitle="Reject this claim?"
                    confirmDescription="The applicant keeps normal account access and may submit a new claim later."
                  >
                    Reject
                  </ConfirmSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-lg font-semibold">Recently decided</h2>
          <ul className="mt-3 space-y-2">
            {decided.slice(0, 10).map((claim) => (
              <li
                key={claim.id}
                className="text-muted-foreground flex items-center gap-2 text-sm"
              >
                <Badge
                  variant={claim.status === "approved" ? "default" : "muted"}
                >
                  {claim.status}
                </Badge>
                {claim.brands.name} — {claim.applicant_name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
