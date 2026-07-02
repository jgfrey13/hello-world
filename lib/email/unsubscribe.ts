import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless unsubscribe tokens: HMAC-SHA256 of the normalized email, keyed
 * by a server secret. The token in an email's unsubscribe link proves the
 * bearer received that email — no database round-trip and no guessable ids.
 */

function secret(): string {
  // Server-only secret; the service key doubles as HMAC key material so no
  // extra env var is needed. Never expose derived tokens' inputs.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("unsubscribe tokens require server configuration");
  return key;
}

export function makeUnsubscribeToken(email: string): string {
  return createHmac("sha256", secret())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  const expected = Buffer.from(makeUnsubscribeToken(email), "hex");
  const provided = Buffer.from(token, "hex");
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
