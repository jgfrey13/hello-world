import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Brands" };

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "muted" | "outline"
> = {
  published: "default",
  pending_review: "secondary",
  draft: "muted",
  rejected: "outline",
  archived: "outline",
};

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; filter?: string }>;
}) {
  const { status, q, filter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("brands")
    .select(
      "id, name, slug, status, verification_status, subscription_tier, is_demo, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(50);
  if (q) query = query.ilike("name", `%${q}%`);
  if (filter === "draft")
    query = query.in("status", ["draft", "pending_review"]);
  else if (filter) query = query.eq("status", filter as "published");

  const { data: brands, error } = await query;
  if (error) throw new Error(`admin brands list failed: ${error.message}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">Brands</h1>
        <Link
          href="/admin/brands/new"
          className={buttonVariants({ size: "sm" })}
        >
          New brand
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      <form action="/admin/brands" className="mt-4 flex flex-wrap gap-2">
        <label htmlFor="brands-q" className="sr-only">
          Search brands
        </label>
        <Input
          id="brands-q"
          name="q"
          type="search"
          placeholder="Search by name…"
          defaultValue={q}
          className="max-w-xs"
        />
        <label htmlFor="brands-filter" className="sr-only">
          Filter by status
        </label>
        <Select
          id="brands-filter"
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

      {(brands ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No brands match" />
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
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Verification
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {(brands ?? []).map((brand) => (
                <tr key={brand.id} className="border-t">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/brands/${brand.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {brand.name}
                    </Link>
                    {brand.is_demo && (
                      <Badge variant="outline" className="ml-2">
                        demo
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANTS[brand.status] ?? "muted"}>
                      {brand.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {brand.verification_status}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {brand.subscription_tier}
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
