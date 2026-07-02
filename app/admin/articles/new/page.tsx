import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { ArticleFormFields } from "@/components/admin/article-form";
import { Button } from "@/components/ui/button";
import { createArticleAction } from "@/app/admin/articles/actions";

export const metadata = { title: "New Article" };

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold">New article</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Created as a draft; publishing is a separate admin action.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "sponsor_required" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Sponsored articles must name a sponsor brand.
          </p>
        )}
      </div>
      <form action={createArticleAction} className="mt-6 space-y-5">
        <ArticleFormFields brands={brands ?? []} />
        <Button type="submit">Create draft</Button>
      </form>
    </div>
  );
}
