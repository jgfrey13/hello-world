import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Scheduled-job registry. Jobs are invoked by POST /api/jobs/[job] with the
 * CRON_SECRET bearer token (wire your scheduler — e.g. Vercel Cron — to hit
 * that route). Each job is bounded per run and idempotent.
 */

export interface JobResult {
  ok: boolean;
  detail: Record<string, number | string>;
}

/** Prune rate-limit events older than 7 days. */
async function pruneRateLimits(): Promise<JobResult> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("prune_rate_limit_events", {
    older_than: "7 days",
  });
  if (error) return { ok: false, detail: { error: error.message } };
  return { ok: true, detail: { pruned: "events older than 7 days" } };
}

const LINK_CHECK_BATCH = 25;
const LINK_TIMEOUT_MS = 8000;

/**
 * Check outbound purchase URLs of published products (bounded batch of the
 * least-recently-checked). Results land in link_check_results for staff
 * review — nothing is auto-archived from a failed check.
 */
async function checkLinks(): Promise<JobResult> {
  const supabase = createSupabaseServiceClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, direct_purchase_url, affiliate_url")
    .eq("status", "published")
    .order("last_reviewed_at", { ascending: true, nullsFirst: true })
    .limit(LINK_CHECK_BATCH);
  if (error) return { ok: false, detail: { error: error.message } };

  let checked = 0;
  let broken = 0;
  for (const product of products ?? []) {
    const url = product.affiliate_url ?? product.direct_purchase_url;
    if (!url) continue;
    let ok = false;
    let statusCode: number | null = null;
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      });
      statusCode = response.status;
      // Some shops reject HEAD; retry those with GET before flagging.
      if (response.status === 405 || response.status === 501) {
        const getResponse = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
        });
        statusCode = getResponse.status;
        ok = getResponse.ok;
      } else {
        ok = response.ok;
      }
    } catch {
      ok = false;
    }
    checked++;
    if (!ok) broken++;
    await supabase.from("link_check_results").insert({
      product_id: product.id,
      url,
      ok,
      status_code: statusCode,
    });
  }
  return { ok: true, detail: { checked, broken } };
}

export const JOBS: Record<string, () => Promise<JobResult>> = {
  prune_rate_limits: pruneRateLimits,
  check_links: checkLinks,
};
