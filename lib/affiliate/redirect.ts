/**
 * Pure decision logic for the /go/[slug] affiliate redirect — kept free of
 * I/O so every branch is unit-testable (see tests/unit/affiliate.test.ts).
 * The route handler wraps this with the DB lookup and click recording.
 */

export interface RedirectableProduct {
  id: string;
  brand_id: string;
  status: string;
  affiliate_url: string | null;
  direct_purchase_url: string | null;
}

export type RedirectDecision =
  | { kind: "redirect"; url: string; destinationType: "affiliate" | "direct" }
  | { kind: "not_found" }
  | { kind: "gone" }
  | { kind: "no_destination" };

const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$)|\.(local|internal)$/i;

/**
 * A destination is approved only if it is a well-formed absolute https URL
 * without embedded credentials pointing at a public host. Destinations are
 * staff-entered and validated on write; this re-validates on every redirect
 * so a bad row can never become an open redirect.
 */
export function isApprovedDestination(url: string | null): url is string {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  if (PRIVATE_HOST_PATTERN.test(parsed.hostname)) return false;
  // IPv4/IPv6 literals are never approved destinations.
  if (/^[\d.]+$/.test(parsed.hostname) || parsed.hostname.includes(":")) {
    return false;
  }
  return true;
}

export function resolveRedirect(
  product: RedirectableProduct | null,
): RedirectDecision {
  if (!product) return { kind: "not_found" };
  // Products that existed but are no longer published are gone, not moved —
  // we never redirect traffic for delisted records.
  if (product.status !== "published") return { kind: "gone" };

  if (isApprovedDestination(product.affiliate_url)) {
    return {
      kind: "redirect",
      url: product.affiliate_url,
      destinationType: "affiliate",
    };
  }
  if (isApprovedDestination(product.direct_purchase_url)) {
    return {
      kind: "redirect",
      url: product.direct_purchase_url,
      destinationType: "direct",
    };
  }
  return { kind: "no_destination" };
}
