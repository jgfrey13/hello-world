# Known Limitations & Data Lifecycle — MadeHere

## Current status (Phase 2 complete)

Phases 0–2 are done: docs/config, the application foundation (Next.js 16 +
TypeScript strict + Tailwind v4, tokens, layout, components, public shells with
labeled fictional demo content), and now the database & authentication layer:

- 21-table schema in `supabase/migrations/` (UUID PKs, timestamps, FKs,
  indexes, enums, check constraints) with **RLS enabled and tested on every
  table**, integrity triggers (role changes admin-only, classification
  admin-only, evidence approval admin-only + source required), an append-only
  audit log, and storage buckets/policies.
- Generated `lib/database/types.ts` (via `npm run db:types`).
- Supabase clients (`lib/supabase`), Zod env validation (`lib/security/env`),
  shared entity schemas (`lib/validation`), role helpers (`lib/auth`),
  middleware session refresh + `/admin`·`/brand-dashboard` gating, and
  login/signup/callback/sign-out auth flows.
- Fictional seed (12 brands / 30 products / 8 categories / 7 articles, all
  `is_demo`) with a verified remove script.
- Vitest: 33 tests green, including 17 RLS integration tests covering the
  required authorization matrix (drafts hidden, no self-role-elevation,
  owners can't touch products/evidence/classifications, claims pending-only
  - duplicate-blocked, no self-granted paid status, newsletter/audit private).

Current limitations (replaced in later phases):

- Public pages still render `lib/demo/content.ts`, not the database — the
  swap to `lib/database` queries is Phase 3. Form shells stay disabled until
  their server actions land (Phases 5/8).
- Auth flows are implemented against Supabase Auth but need a real Supabase
  project (or `supabase start`) to exercise end-to-end; they are not covered
  by automated tests yet (Playwright e2e lands Phase 10).
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
