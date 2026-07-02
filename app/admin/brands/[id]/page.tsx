import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { BrandFormFields } from "@/components/admin/brand-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import {
  setBrandStatusAction,
  setBrandVerificationAction,
  updateBrandAction,
} from "@/app/admin/brands/actions";

export const metadata = { title: "Edit Brand" };

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status }, current] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const isAdmin = current?.profile?.role === "admin";

  const supabase = await createSupabaseServerClient();
  const [{ data: brand }, { data: categories }, { data: links }] =
    await Promise.all([
      supabase.from("brands").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id, name").order("display_order"),
      supabase
        .from("brand_categories")
        .select("category_id")
        .eq("brand_id", id),
    ]);
  if (!brand) notFound();

  const isPublished = brand.status === "published";

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-bold">{brand.name}</h1>
        <Badge>{brand.status}</Badge>
        {brand.is_demo && <Badge variant="outline">demo</Badge>}
        <Link
          href={`/brands/${brand.slug}`}
          className="text-sm underline underline-offset-4"
        >
          View public page
        </Link>
      </div>
      {brand.is_demo && (
        <p className="text-destructive mt-2 text-sm">
          Fictional demo record — must never be presented as factual content
          about a real company.
        </p>
      )}
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "forbidden" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Published records can only be edited by admins.
          </p>
        )}
      </div>

      {/* Status + verification controls */}
      <div className="bg-secondary mt-6 space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Lifecycle</p>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            {!isPublished && (
              <form action={setBrandStatusAction}>
                <input type="hidden" name="id" value={brand.id} />
                <input type="hidden" name="status" value="published" />
                <ConfirmSubmitButton
                  size="sm"
                  confirmTitle="Publish this brand?"
                  confirmDescription="The profile becomes publicly visible. Confirm the record is sourced and reviewed."
                >
                  Publish
                </ConfirmSubmitButton>
              </form>
            )}
            {isPublished && (
              <form action={setBrandStatusAction}>
                <input type="hidden" name="id" value={brand.id} />
                <input type="hidden" name="status" value="archived" />
                <ConfirmSubmitButton
                  size="sm"
                  variant="destructive"
                  confirmTitle="Archive this brand?"
                  confirmDescription="The profile is removed from public view. It can be re-published later."
                >
                  Archive
                </ConfirmSubmitButton>
              </form>
            )}
            {brand.status === "draft" && (
              <form action={setBrandStatusAction}>
                <input type="hidden" name="id" value={brand.id} />
                <input type="hidden" name="status" value="pending_review" />
                <Button type="submit" size="sm" variant="outline">
                  Mark ready for review
                </Button>
              </form>
            )}
            <form action={setBrandVerificationAction}>
              <input type="hidden" name="id" value={brand.id} />
              <input
                type="hidden"
                name="verification"
                value={
                  brand.verification_status === "approved"
                    ? "pending"
                    : "approved"
                }
              />
              <ConfirmSubmitButton
                size="sm"
                variant="outline"
                confirmTitle={
                  brand.verification_status === "approved"
                    ? "Remove the evidence-reviewed designation?"
                    : "Mark this brand evidence-reviewed?"
                }
                confirmDescription="Verification is an evidence outcome — it is independent of subscription tier and must reflect approved evidence."
              >
                {brand.verification_status === "approved"
                  ? "Un-verify"
                  : "Mark evidence-reviewed"}
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {brand.status === "draft" ? (
              <>Editors can edit drafts; publishing is admin-only.</>
            ) : (
              <>Publishing and verification changes are admin-only.</>
            )}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Tier: {brand.subscription_tier} (managed by billing — never affects
          classification or verification)
        </p>
      </div>

      <form action={updateBrandAction} className="mt-6 space-y-5">
        <input type="hidden" name="id" value={brand.id} />
        <BrandFormFields
          brand={brand}
          categories={categories ?? []}
          selectedCategoryIds={(links ?? []).map((l) => l.category_id)}
        />
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
