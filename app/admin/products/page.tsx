import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/states";
import { classificationLabel } from "@/lib/verification/classification";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; filter?: string }>;
}) {
  const { status, q, filter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, status, manufacturing_classification, is_demo, updated_at, brands!inner(name)",
    )
    .order("updated_at", { ascending: false })
    .limit(50);
  if (q) query = query.ilike("name", `%${q}%`);
  if (filter === "draft")
    query = query.in("status", ["draft", "pending_review"]);
  else if (filter) query = query.eq("status", filter as "published");

  const { data: products, error } = await query;
  if (error) throw new Error(`admin products list failed: ${error.message}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className={buttonVariants({ size: "sm" })}
        >
          New product
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      <form action="/admin/products" className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="products-q" className="sr-only">
          Search products
        </label>
        <Input
          id="products-q"
          name="q"
          type="search"
          placeholder="Search by name…"
          defaultValue={q}
          className="max-w-xs"
        />
        <label htmlFor="products-filter" className="sr-only">
          Filter by status
        </label>
        <Select
          id="products-filter"
          name="filter"
          defaultValue={filter ?? ""}
          className="max-w-44"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft / pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {(products ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No products match" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Brand
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Classification
                </th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.is_demo && (
                      <Badge variant="outline" className="ml-2">
                        demo
                      </Badge>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {product.brands.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={
                        product.status === "published" ? "default" : "muted"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {classificationLabel(product.manufacturing_classification)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
