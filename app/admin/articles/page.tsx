import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ARTICLE_TYPE_LABELS } from "@/lib/database/shapes";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, title, slug, article_type, status, is_sponsored, is_demo, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`admin articles failed: ${error.message}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">Articles</h1>
        <Link
          href="/admin/articles/new"
          className={buttonVariants({ size: "sm" })}
        >
          New article
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {(articles ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No articles yet" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Title
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(articles ?? []).map((article) => (
                <tr key={article.id} className="border-t">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {article.title}
                    </Link>
                    {article.is_sponsored && (
                      <Badge variant="accent" className="ml-2">
                        sponsored
                      </Badge>
                    )}
                    {article.is_demo && (
                      <Badge variant="outline" className="ml-2">
                        demo
                      </Badge>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {ARTICLE_TYPE_LABELS[article.article_type]}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant={
                        article.status === "published" ? "default" : "muted"
                      }
                    >
                      {article.status}
                    </Badge>
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
