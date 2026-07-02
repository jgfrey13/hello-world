import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * DB-backed sliding-window rate limiter for public forms — works across
 * serverless instances. Keys are salted SHA-256 hashes of the caller's IP;
 * raw IPs are never stored (data minimization).
 */

const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10);

async function callerKeyHash(): Promise<string> {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  // Salt so hashes are not globally linkable; dedicated salt preferred,
  // service key as fallback.
  const salt =
    process.env.RATE_LIMIT_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "rate-limit-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export type RateLimitResult = { allowed: true } | { allowed: false };

/**
 * Record a hit in `bucket` and report whether the caller is within limits.
 * Fails closed on database errors — a broken limiter must not disable
 * spam protection.
 */
export async function checkRateLimit(bucket: string): Promise<RateLimitResult> {
  const keyHash = await callerKeyHash();
  const supabase = createSupabaseServiceClient();
  const windowStart = new Date(
    Date.now() - WINDOW_SECONDS * 1000,
  ).toISOString();

  const { count, error: countError } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("key_hash", keyHash)
    .gte("occurred_at", windowStart);

  if (countError) return { allowed: false };
  if ((count ?? 0) >= MAX_REQUESTS) return { allowed: false };

  const { error: insertError } = await supabase
    .from("rate_limit_events")
    .insert({ bucket, key_hash: keyHash });
  if (insertError) return { allowed: false };

  return { allowed: true };
}

/**
 * Honeypot check: real users never fill the visually-hidden "website2"
 * field; bots do. Returns true when the submission looks like spam.
 */
export function isSpamSubmission(formData: FormData): boolean {
  const honeypot = formData.get("website2");
  return typeof honeypot === "string" && honeypot.length > 0;
}
