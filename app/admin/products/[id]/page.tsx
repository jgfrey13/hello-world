import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { ProductFormFields } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import {
  CLASSIFICATION_LABELS,
  MANUFACTURING_CLASSIFICATIONS,
} from "@/lib/verification/classification";
import {
  setProductClassificationAction,
  setProductStatusAction,
  updateProductAction,
} from "@/app/admin/products/actions";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({
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
  const [{ data: product }, { data: brands }, { data: categories }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("brands").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("display_order"),
    ]);
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-bold">{product.name}</h1>
        <Badge>{product.status}</Badge>
        {product.is_demo && <Badge variant="outline">demo</Badge>}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm underline underline-offset-4"
        >
          View public page
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "forbidden" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Published records can only be edited by admins.
          </p>
        )}
      </div>

      {/* Lifecycle: status + classification (admin-only) */}
      <div className="bg-secondary mt-6 space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">Classification:</p>
          <ManufacturingStatusBadge
            classification={product.manufacturing_classification}
          />
        </div>
        {isAdmin ? (
          <>
            <form
              action={setProductClassificationAction}
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="id" value={product.id} />
              <div className="space-y-1.5">
                <Label htmlFor="p-classification">Set classification</Label>
                <Select
                  id="p-classification"
                  name="classification"
                  defaultValue={product.manufacturing_classification}
                  className="min-w-64"
                >
                  {MANUFACTURING_CLASSIFICATIONS.map((value) => (
                    <option key={value} value={value}>
                      {CLASSIFICATION_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </div>
              <ConfirmSubmitButton
                size="sm"
                confirmTitle="Change the manufacturing classification?"
                confirmDescription="Classification must reflect reviewed evidence. This change is audited and is never influenced by billing."
              >
                Update classification
              </ConfirmSubmitButton>
            </form>
            <div className="flex flex-wrap gap-2">
              {product.status !== "published" ? (
                <form action={setProductStatusAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="status" value="published" />
                  <ConfirmSubmitButton
                    size="sm"
                    confirmTitle="Publish this product?"
                    confirmDescription="The product becomes publicly visible with its current classification and evidence."
                  >
                    Publish
                  </ConfirmSubmitButton>
                </form>
              ) : (
                <form action={setProductStatusAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="status" value="archived" />
                  <ConfirmSubmitButton
                    size="sm"
                    variant="destructive"
                    confirmTitle="Archive this product?"
                    confirmDescription="The product is removed from public view. It can be re-published later."
                  >
                    Archive
                  </ConfirmSubmitButton>
                </form>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Classification and publishing controls are admin-only.
          </p>
        )}
      </div>

      <form action={updateProductAction} className="mt-6 space-y-5">
        <input type="hidden" name="id" value={product.id} />
        <ProductFormFields
          product={product}
          brands={brands ?? []}
          categories={categories ?? []}
        />
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
