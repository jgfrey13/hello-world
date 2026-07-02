# CLAUDE.md — MadeHere

Persistent project instructions. Keep this focused on durable rules. Detailed
specs live in `docs/` and `.claude/rules/`.

## Project purpose

MadeHere is a searchable consumer discovery and affiliate-commerce platform for
products manufactured in the United States. It helps consumers find American-made
brands and products, review the **evidence** behind manufacturing claims, compare
options, and shop through tracked affiliate links. It is an evidence-based
editorial platform — **not** an official certification body and **not** political
advocacy.

## Technology stack

- Next.js (App Router) + TypeScript + React (Server Components by default)
- Tailwind CSS + shadcn/ui (Radix) accessible components
- Supabase: Postgres, Auth, Row-Level Security, Storage, migrations
- Stripe: subscriptions (test mode first), Customer Portal, signed webhooks
- Resend: transactional email
- Zod: shared validation schemas (one per entity, reused everywhere)
- Vitest (unit/integration), Playwright + axe (e2e/accessibility)
- First-party analytics stored in Postgres (no third-party trackers at launch)

## Repository structure

See `docs/architecture.md`. Top level: `app/`, `components/`, `lib/`,
`supabase/`, `tests/`, `docs/`, `.claude/`.

## Standard commands

```bash
npm run dev            # local dev server
npm run build          # production build (must pass to finish a phase)
npm run lint           # eslint
npm run format         # prettier --write
npm run typecheck      # tsc --noEmit
npm run test           # vitest unit/integration
npm run test:e2e       # playwright
npm run db:migrate     # apply supabase migrations
npm run db:types       # regenerate lib/database/types.ts
npm run db:seed        # load fictional demo data
npm run db:seed:remove # remove demo data
```
(Commands are wired up as their phases land; a command that does not yet exist
means its phase is not complete.)

## Coding conventions

- TypeScript strict. **Never use `any` to dodge a type error.**
- No business logic in UI components. Logic lives in `lib/` services.
- All DB access goes through typed `lib/database` functions — no scattered queries.
- All API/action responses are typed. Validate every input with the shared Zod schema.
- Prefer server-side data fetching (RSC) and Server Actions over client fetching.
- Prefer database constraints over application assumptions.
- Match surrounding style; do not do large unrelated refactors without approval.

## Security rules

- Authorization is enforced **server-side and in the database (RLS)**. UI hiding
  is never the security boundary.
- Public users may read only **published** public records.
- Role changes are **admin-only** and can never be self-serviced. No user may
  elevate their own privileges.
- Never expose service-role keys, Stripe/Resend secrets, DB passwords, internal
  notes, unreviewed evidence, or private submitter information.
- Validate and allowlist redirect destinations. Verify Stripe webhook signatures.
- Redact secrets from logs. Least-privilege service credentials.
- See `.claude/rules/security.md`.

## Database migration rules

- Every schema change is a migration file in `supabase/migrations/`. Never edit
  applied migrations; add a new one.
- Every table: UUID PK, `created_at`, `updated_at`, FK constraints, appropriate
  indexes, check constraints on enums, and RLS enabled.
- Regenerate `lib/database/types.ts` after any schema change (`npm run db:types`).
- See `.claude/rules/database.md`.

## Testing requirements

- Test business risk, not superficial rendering. Authorization, affiliate
  redirects, claims, evidence, Stripe webhooks, forms, and search are required
  coverage areas (see `.claude/rules/testing.md`).
- A feature is not done until its relevant tests, types, lint, and production
  build all pass.

## Definition of done

A feature is complete only when: real application logic backs it; it uses the
intended database; authorization is enforced server-side; input is validated;
loading/empty/success/error states exist; mobile works; relevant tests pass;
types pass; lint passes; the production build succeeds; docs are updated; and no
placeholder is presented as a finished integration. Full checklist in
`docs/launch-checklist.md`.

## Prohibited shortcuts

- Do not invent brands, facts, sources, partnerships, reviews, sales, or
  certifications.
- Do not build fake dashboard metrics and present them as real.
- Do not protect admin routes with frontend checks only.
- Do not store secrets in source control.
- Do not disable security controls to make tests pass.
- Do not use `any` to avoid solving TypeScript problems.
- Do not ignore failing tests.
- Do not publish real-company records without sourced information.

## Content & verification rules

- **American-made claims require supporting evidence.** Never infer domestic
  manufacturing from headquarters, ownership, founder nationality, imagery, a
  name containing "USA/America", or "designed in America".
- Classify at the **product** level where possible, using the enum in
  `docs/verification-methodology.md`. Display human-readable labels, store enum
  values.
- A paid subscription must **never** alter a manufacturing classification,
  guarantee verification, suppress an accurate correction, or buy an editorial
  recommendation.
- **Sponsored and affiliate content must be conspicuously disclosed** every time.
- AI-generated summaries must store the underlying source separately; AI output
  is never treated as evidence.

## Secrets

- Never commit secrets. `.env*` and local secret files are git-ignored.
- `.env.example` contains placeholder names only.

## Approval gates

Do not commit, push, delete remote resources, deploy, incur paid usage, or
modify live data without explicit user approval. Present phase plans/results and
wait for approval at phase boundaries.
