import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless unsubscribe tokens: `issuedAt.HMAC-SHA256(email + "." + issuedAt)`
 * keyed by a server secret. The token in an email's unsubscribe link proves
 * the bearer received that email — no database round-trip and no guessable
 * ids — and expires so a leaked link is not a permanent capability.
 */

const TOKEN_VALIDITY_SECONDS = 30 * 24 * 60 * 60; // 30 days

function secret(): string {
  // Dedicated secret preferred; the service key remains a fallback so a
  // rotation of one does not silently invalidate the other's tokens.
  const key =
    process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("unsubscribe tokens require server configuration");
  return key;
}

function sign(email: string, issuedAt: number): string {
  return createHmac("sha256", secret())
    .update(`${email.trim().toLowerCase()}.${issuedAt}`)
    .digest("hex");
}

export function makeUnsubscribeToken(
  email: string,
  issuedAt = Math.floor(Date.now() / 1000),
): string {
  return `${issuedAt}.${sign(email, issuedAt)}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return false;
  const issuedAt = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60) return false; // future-dated tokens are forged
  if (now - issuedAt > TOKEN_VALIDITY_SECONDS) return false; // expired
  const expected = Buffer.from(sign(email, issuedAt), "hex");
  const provided = Buffer.from(match[2], "hex");
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    token: makeUnsubscribeToken(email),
  });
  return `${base}/newsletter/unsubscribe?${params.toString()}`;
}
