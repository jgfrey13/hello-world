import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { BrandFormFields } from "@/components/admin/brand-form";
import { Button } from "@/components/ui/button";
import { createBrandAction } from "@/app/admin/brands/actions";

export const metadata = { title: "New Brand" };

export default async function NewBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("display_order");

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold">New brand</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Created as a draft. Publishing is a separate admin action, and
        manufacturing claims require reviewed evidence.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>
      <form action={createBrandAction} className="mt-6 space-y-5">
        <BrandFormFields
          categories={categories ?? []}
          showAdminFlags={current?.profile?.role === "admin"}
        />
        <Button type="submit">Create draft</Button>
      </form>
    </div>
  );
}
