import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { ArticleFormFields } from "@/components/admin/article-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { articleHref } from "@/lib/database/shapes";
import {
  setArticleStatusAction,
  updateArticleAction,
} from "@/app/admin/articles/actions";

export const metadata = { title: "Edit Article" };

export default async function EditArticlePage({
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
  const [{ data: article }, { data: brands }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  if (!article) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-bold">{article.title}</h1>
        <Badge>{article.status}</Badge>
        {article.is_demo && <Badge variant="outline">demo</Badge>}
        <Link
          href={articleHref({
            slug: article.slug,
            articleType: article.article_type,
          })}
          className="text-sm underline underline-offset-4"
        >
          View public page
        </Link>
      </div>
      <div className="mt-4">
        <FormStatusBanner status={status} />
        {status === "sponsor_required" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Sponsored articles must name a sponsor brand.
          </p>
        )}
        {status === "forbidden" && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            Published articles can only be edited by admins.
          </p>
        )}
      </div>

      {isAdmin && (
        <div className="bg-secondary mt-6 flex flex-wrap gap-2 rounded-lg border p-4">
          {article.status !== "published" ? (
            <form action={setArticleStatusAction}>
              <input type="hidden" name="id" value={article.id} />
              <input type="hidden" name="status" value="published" />
              <ConfirmSubmitButton
                size="sm"
                confirmTitle="Publish this article?"
                confirmDescription="The article becomes publicly visible with its disclosures. Confirm sponsorship and affiliate labeling are correct."
              >
                Publish
              </ConfirmSubmitButton>
            </form>
          ) : (
            <form action={setArticleStatusAction}>
              <input type="hidden" name="id" value={article.id} />
              <input type="hidden" name="status" value="archived" />
              <ConfirmSubmitButton
                size="sm"
                variant="destructive"
                confirmTitle="Archive this article?"
                confirmDescription="The article is removed from public view. It can be re-published later."
              >
                Archive
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      )}

      <form action={updateArticleAction} className="mt-6 space-y-5">
        <input type="hidden" name="id" value={article.id} />
        <ArticleFormFields article={article} brands={brands ?? []} />
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
