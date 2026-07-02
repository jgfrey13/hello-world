# Known Limitations & Data Lifecycle — MadeHere

## Current status (Phase 7 complete)

Phases 0–7 are done. Phase 7 adds the commercial layer:

- **/go/[slug] tracked redirect**: published-product lookup, destination
  re-validation on every hit (https only, no credentials, no private/IP
  hosts — a bad row can never become an open redirect), privacy-conscious
  click recording (no IP/UA/user id), affiliate URL with direct-URL
  fallback, 404 for unknown slugs, 410 for delisted products, product-page
  fallback when no destination exists; no-store + noindex on redirects.
  Purchase buttons now route through it. Decision logic is a pure function
  with every branch unit-tested.
- **Stripe (test-mode first)**: server-side checkout sessions and Customer
  Portal from the brand dashboard (ownership-checked; honest disabled state
  when billing env is absent); signature-verified webhook with a DB
  idempotency ledger (claim-before-apply, released on failure so Stripe
  retries work); subscription sync writes plan/status/periods and the
  brand's TIER only — cancellation preserves the free Basic listing and
  can never touch published status, classification, or verification
  (unit-tested invariant). Entitlement is written exclusively by the
  webhook; no client-reported paid status.
- Runtime-smoked: /go 404s bad slugs without DB, 503s when DB is down;
  webhook rejects missing/invalid signatures with 400.

Phase 6 summary (brand-owner dashboard):

- **/brand-dashboard** (sign-in required; visibility driven entirely by
  brand_owners grants via RLS): owned-brand overview; per-brand page with
  real 30-day analytics counts (profile views, product views, outbound
  clicks — brand/product views are now recorded first-party on published
  pages, fire-and-forget, no visitor PII), subscription tier display (with
  the paid-content firewall restated), product list with classifications.
- **Owner submissions**: propose-profile-update and submit-new-product
  forms create pending proposed_changes. The payload whitelists are shared
  schemas between the owner forms and the admin apply step (unit-tested to
  reject classification/status/verification/billing keys), and product_new
  approvals create a _draft_ product with classification awaiting_review.
- **Media**: owners upload logo/hero (server-validated MIME/size, stored
  under the brand's folder in the public bucket, audited); logos render on
  brand profiles via next/image. Claim proof uploads are live too (private
  claim-proofs bucket, RLS-scoped to the uploader's folder, admin-read).
- Header shows account state (sign in / dashboards / sign out).

Earlier-phase summary: docs/config; app foundation; 22-table schema with
tested RLS + integrity triggers + audit log; public directory on Postgres
full-text search; editorial content with disclosures and article SEO; admin
review queues and CRUD; live public intake forms with rate limiting.

- **Public forms are live**: submit-a-brand and corrections (validated,
  DB-backed rate limiting + honeypot, service-role inserts into pending
  queues — the public has no direct table access), and profile claims
  (authentication required; RLS guarantees own/pending-only; duplicate
  pending claims blocked; a claim grants nothing by itself).
- **/admin** (editor/admin gated in middleware + layout + per-action role
  checks, RLS underneath): dashboard with real live counts; brands,
  products, categories, and articles CRUD (drafts by editors; publishing,
  archiving, verification, and classification changes admin-only with
  confirmation dialogs); evidence-review queue (approval requires a source
  and records the reviewer — DB-enforced); claims review (approval creates
  the brand_owners grant and upgrades the claimant role — the only access
  path); brand-submission review (approval creates a _draft_ brand, never a
  published one); corrections queue; proposed-changes review (approval
  applies a strict whitelist of descriptive fields — classification/status/
  evidence fields can never be applied); sponsorship records; newsletter
  and audit-log views.
- **Audit logging** on every sensitive action (publish/archive, evidence
  decisions, claims, classification changes, role-affecting approvals).
- Vitest: 49 tests green (unit + RLS integration incl. rate-limit table
  privacy).

Current limitations (replaced in later phases):

- Newsletter signup stays an honest disabled state until Phase 8.
- Page-view analytics count every render of a published page (no bot
  filtering or session dedup yet) — owner metrics are honest raw counts,
  labeled as such. Refine in the analytics pass.
- The header reads session state, so previously-static pages (methodology,
  pricing, policies) now render dynamically; revisit with the caching
  strategy in Phase 10.
- Admin flows are enforced at three layers (middleware, per-action role
  checks, RLS — the latter integration-tested), but browser-level e2e for
  the admin UI lands in Phase 10 with Playwright.
- Rate limiting keys on a salted hash of the caller IP with a DB-backed
  sliding window; tune window/limits via env. A scheduled job should call
  prune_rate_limit_events() periodically (Phase 9 job framework).
- Articles have no dedicated sources field yet; sources are cited through
  linked evidence and in-body references.
- Purchase buttons link to stored destinations directly (with disclosure);
  the tracked `/go/[slug]` redirect replaces them in Phase 7.
- "Relevance" sort currently means featured-first + name; true `ts_rank`
  ordering needs a Postgres RPC — planned alongside the search-quality pass.
- DB-backed pages are `force-dynamic` (no build-time DB dependency); public
  caching/revalidation strategy is deliberately deferred to the performance
  review (Phase 10).
- This environment cannot run PostgREST/GoTrue (network policy blocks the
  binaries), so lib/database and auth flows can't be exercised end-to-end
  here. Verified instead: SQL behavior via psql + RLS suite, build, and a
  runtime smoke test confirming DB-backed pages degrade to the error
  boundary (with server-logged cause) when Supabase is unreachable. Full
  Playwright e2e against a real stack lands in Phase 10.
- `db:migrate` uses a psql-based runner with its own `__migrations` tracking
  table — teams using `supabase db push` should pick one mechanism and stick
  to it. Local validation uses `scripts/db/supabase-local-shim.sql` to emulate
  Supabase's auth/storage/roles on plain Postgres; never run the shim against
  a real Supabase project.
- The Supabase CLI's docker-based typegen can't run here (registry blocked);
  `npm run db:types` uses `@supabase/postgres-meta` directly — the same
  generator, identical output.
- The shadcn CLI registry (`ui.shadcn.com`) is blocked by this environment's
  network policy, so the `components/ui` primitives are vendored by hand on
  Radix (`radix-ui` package) — same architecture, maintained in-repo.
- `npm audit` reports 2 moderate advisories in Next's _bundled_ postcss
  (GHSA-qx2v-qp2m-jg93); the only offered "fix" downgrades Next to 9.x. Not
  applicable to our usage (no untrusted CSS stringification); revisit on the
  next Next.js patch release.

## Deliberate MVP exclusions

- Autonomous/uncontrolled scraping (only manual entry + CSV import at launch).
- Bulk/marketing email campaigns (signup capture only until consent + unsubscribe
  - sender-domain auth complete).
- Live/production Stripe payments (test mode only until go-live gate met).
- Consumer premium memberships, marketplace commissions, price alerts, saved
  products/wish lists, data/trend reports, white-label data (architecture-ready,
  not built).
- Third-party analytics (first-party only at launch).
- Dedicated search service (Postgres full-text + indexed filters first).

## Search migration threshold

Move to a dedicated search service (e.g. Typesense/Meilisearch/Postgres+pgvector)
only when: dataset exceeds ~50k products, or p95 search latency exceeds ~300ms on
representative queries, or relevance quality testing shows Postgres FTS is
insufficient. Document the trigger before migrating.

## Data lifecycle / retention (targets, finalize with counsel)

| Data                                | Retention target                                   |
| ----------------------------------- | -------------------------------------------------- |
| Affiliate-click events              | Aggregate indefinitely; raw event rows ~13 months. |
| Form submissions (brand/correction) | Until resolved + 12 months, then archive.          |
| Audit log                           | 24 months minimum.                                 |
| Rejected profile claims             | 12 months, then purge PII.                         |
| Unsubscribed newsletter records     | Keep suppression hash; purge other PII.            |

## Privacy posture

Collect only what's needed. No precise visitor geolocation, full IP history,
cross-site profiles, sensitive attributes, or card data. Anonymous session ids
for first-party analytics where practical.

## Legal disclaimers

Policy pages (affiliate disclosure, sponsorship, editorial standards, correction,
privacy, terms, AI-use, data-source) ship as **templates requiring qualified
legal review** before production. MadeHere is not a certification body.

## Bottlenecks

None measured yet. Record measured bottlenecks here as they are found; do not
speculatively optimize.
