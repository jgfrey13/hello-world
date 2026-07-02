import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertCategoryAction } from "@/app/admin/categories/actions";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; edit?: string }>;
}) {
  const { status, edit } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order")
    .order("name");
  if (error) throw new Error(`admin categories failed: ${error.message}`);

  const editing = (categories ?? []).find((category) => category.id === edit);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold">Categories</h1>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      <ul className="mt-6 divide-y rounded-lg border">
        {(categories ?? []).map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span>
              <span className="font-medium">{category.name}</span>{" "}
              <span className="text-muted-foreground">/{category.slug}</span>
              {!category.is_active && (
                <Badge variant="outline" className="ml-2">
                  inactive
                </Badge>
              )}
            </span>
            <a
              href={`/admin/categories?edit=${category.id}`}
              className="underline underline-offset-4"
            >
              Edit
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-serif text-lg font-semibold">
        {editing ? `Edit “${editing.name}”` : "Add category"}
      </h2>
      <form action={upsertCategoryAction} className="mt-3 space-y-4">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              name="name"
              required
              defaultValue={editing?.name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-slug">Slug</Label>
            <Input
              id="c-slug"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={editing?.slug}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-order">Display order</Label>
            <Input
              id="c-order"
              name="displayOrder"
              type="number"
              min={0}
              defaultValue={editing?.display_order ?? 0}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-description">Description</Label>
          <Textarea
            id="c-description"
            name="description"
            maxLength={500}
            defaultValue={editing?.description ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editing?.is_active ?? true}
          />
          Active (visible in public navigation and filters)
        </label>
        <Button type="submit">
          {editing ? "Save changes" : "Add category"}
        </Button>
      </form>
    </div>
  );
}
