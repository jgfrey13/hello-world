import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { ProductFormFields } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { createProductAction } from "@/app/admin/products/actions";

export const metadata = { title: "New Product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("display_order"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold">New product</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Created as a draft with classification “Awaiting Review”. The
        classification is set separately by an admin, in line with evidence.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>
      <form action={createProductAction} className="mt-6 space-y-5">
        <ProductFormFields
          brands={brands ?? []}
          categories={categories ?? []}
        />
        <Button type="submit">Create draft</Button>
      </form>
    </div>
  );
}
