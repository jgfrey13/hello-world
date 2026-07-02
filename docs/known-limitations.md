# Known Limitations & Data Lifecycle — MadeHere

## Current status (Phase 4 complete)

Phases 0–4 are done: docs/config, the application foundation, the database &
authentication layer (21 tables with tested RLS, integrity triggers, audit
log, storage policies, generated types, auth flows, fictional seed), the
public directory on real data (full-text search, filters, pagination,
brand/product/category detail pages, honest per-product classification
display), and now editorial content:

- Article detail pages: shopping guides at `/guides/[slug]`, stories and
  other editorial at `/articles/[slug]`, with a permanent redirect keeping
  one canonical URL per article.
- Shared article renderer: type label, author/published/updated line,
  linked products with editorial "best for" labels, brands mentioned,
  related reading. Body is stored as plain text and rendered as paragraphs
  — no raw-HTML injection surface.
- Disclosures as components: conspicuous sponsor disclosure (with sponsor
  name/link) on every sponsored article, affiliate disclosure whenever
  required — and sponsorship is disclosed in structured data too.
- SEO: editable seo_title/seo_description columns drive metadata, canonical
  URLs, Open Graph article tags, and Article JSON-LD; unpublished records
  are always noindex.
- Vitest: 47 tests green (unit + RLS integration).

Current limitations (replaced in later phases):

- Form shells stay disabled until their server actions land (Phases 5/8).
- Articles have no dedicated sources field yet; sources are cited through
  linked evidence and in-body references. Revisit with the editorial
  workflow (Phase 5).
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
