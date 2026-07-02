import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/states";
import {
  addResearchSourceAction,
  setResearchStatusAction,
} from "@/app/admin/research/actions";

export const metadata = { title: "Research Queue" };

const MANUAL_STATUSES = [
  "discovered",
  "queued",
  "needs_review",
  "approved",
  "rejected",
  "failed",
] as const;

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("editor");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const [{ data: records, error }, { data: brokenLinks }] = await Promise.all([
    supabase
      .from("ingestion_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("link_check_results")
      .select("url, status_code, checked_at, products(name, slug)")
      .eq("ok", false)
      .order("checked_at", { ascending: false })
      .limit(20),
  ]);
  if (error) throw new Error(`research queue failed: ${error.message}`);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold">Research queue</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Candidate sources for brands and manufacturing claims. Records carry
        sources for human review — nothing here auto-publishes, and AI output is
        never treated as evidence.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      <form
        action={addResearchSourceAction}
        className="mt-6 space-y-3 rounded-lg border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rs-url">Source URL</Label>
            <Input
              id="rs-url"
              name="sourceUrl"
              type="url"
              placeholder="https://"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rs-name">Candidate brand (optional)</Label>
            <Input id="rs-name" name="candidateName" maxLength={200} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rs-note">Research note</Label>
          <Textarea id="rs-note" name="sourceNote" maxLength={5000} />
        </div>
        <Button type="submit" size="sm">
          Add source
        </Button>
      </form>

      {(records ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No research records yet" />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {(records ?? []).map((record) => (
            <li key={record.id} className="rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={record.source_url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="font-medium underline underline-offset-4"
                >
                  {record.candidate_name ??
                    record.normalized_domain ??
                    record.source_url}
                </a>
                <Badge variant="muted">{record.status}</Badge>
              </div>
              {record.source_note && (
                <p className="text-muted-foreground mt-1">
                  {record.source_note}
                </p>
              )}
              <form
                action={setResearchStatusAction}
                className="mt-2 flex items-end gap-2"
              >
                <input type="hidden" name="id" value={record.id} />
                <div className="space-y-1">
                  <Label htmlFor={`rs-status-${record.id}`} className="text-xs">
                    Set status
                  </Label>
                  <Select
                    id={`rs-status-${record.id}`}
                    name="status"
                    defaultValue={record.status}
                    className="h-8 min-w-40 text-xs"
                  >
                    {MANUAL_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" size="sm" variant="outline">
                  Update
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-serif text-lg font-semibold">
        Broken links (latest checks)
      </h2>
      {(brokenLinks ?? []).length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          No broken links detected. The link-check job runs on a schedule (see
          docs/operations in deployment docs).
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-lg border">
          {(brokenLinks ?? []).map((result, index) => (
            <li key={index} className="px-4 py-2.5 text-sm">
              <span className="font-medium">
                {result.products?.name ?? "Unknown product"}
              </span>{" "}
              <span className="text-destructive">
                {result.status_code ?? "unreachable"}
              </span>{" "}
              <span className="text-muted-foreground break-all">
                {result.url}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
