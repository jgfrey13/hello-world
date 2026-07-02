# Affiliate Operations — MadeHere

## Redirect route: `/go/[slug]`

Server-side Route Handler. On each request:

1. Look up the **published** product by slug.
2. Confirm the destination is approved (allowlist + URL validation).
3. Record a privacy-conscious click (`affiliate_clicks`): product, brand,
   article context, destination type/url, referrer path, anonymous session id,
   timestamp. No unnecessary PII.
4. Redirect (302) to `affiliate_url` when present.
5. Fall back to `direct_purchase_url` when no affiliate URL.
6. Reject malformed/unsafe URLs (return a safe error, do not redirect).
7. Do not expose internal tracking implementation details.
8. Handle inactive/missing products gracefully (404/410 as appropriate).

## Destination validation

- Must be absolute `https://` URL.
- Host validated against an approved allowlist / per-product stored destination.
- No open redirect: never redirect to an arbitrary user-supplied URL.

## Disclosure

Every purchase button renders an affiliate disclosure nearby (component, not
incidental copy). Sponsored placements carry a conspicuous sponsored label.

## Data integrity

At launch we track **outbound clicks only**. We never fabricate conversions,
sales, commission revenue, affiliate partnerships, or discount codes. Discount
codes are shown only when genuinely provided by a brand.

## Analytics

Click counts feed brand/product analytics and the admin dashboard (real data
only). Retention for click events is defined in `docs/known-limitations.md` /
privacy section.
