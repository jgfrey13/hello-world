# MadeHere

An evidence-based consumer discovery and affiliate-commerce platform for products
manufactured in the United States. MadeHere helps consumers find American-made
brands and products, review the **evidence** behind manufacturing claims, compare
options, and shop through tracked affiliate links.

> MadeHere is an editorial platform, **not** a certification body and **not**
> political advocacy. American-made claims require supporting evidence.

## Status

**Phase 0 (planning & configuration) complete.** Project rules, subagents, and
documentation are in place. Application code lands phase by phase — see
`docs/known-limitations.md` for current status and
`docs/architecture.md` §implementation for the sequence.

## Tech stack

Next.js (App Router) · TypeScript · React · Tailwind + shadcn/ui · Supabase
(Postgres/Auth/RLS/Storage) · Stripe (test mode first) · Resend · Zod · Vitest ·
Playwright + axe.

## Prerequisites

- Node.js LTS + npm
- A Supabase project (or local Supabase via Docker)
- Stripe account (test mode) and Resend account — for their respective phases

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values; never commit secrets
npm run db:migrate           # apply database migrations
npm run db:types             # regenerate typed DB client
npm run db:seed              # optional: fictional, clearly-labeled demo data
npm run dev                  # http://localhost:3000
```

## Environment variables

See `.env.example` (placeholder names only). Validated at startup; the app fails
fast if a required variable is missing. Service-role/Stripe/Resend secrets are
server-only.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run format     # prettier --write
npm run typecheck  # tsc --noEmit
npm run test       # vitest unit/integration
npm run test:e2e   # playwright + axe

npm run db:migrate      # apply migrations
npm run db:types        # regenerate lib/database/types.ts
npm run db:seed         # load fictional demo data
npm run db:seed:remove  # remove demo data
```

(Commands become available as their phases land.)

## Documentation

- `CLAUDE.md` — persistent project instructions
- `.claude/rules/` — architecture, frontend, database, security, testing,
  content-and-verification, accessibility
- `docs/architecture.md` · `docs/database.md` · `docs/security.md`
- `docs/verification-methodology.md` · `docs/revenue-model.md`
- `docs/content-operations.md` · `docs/import-process.md`
- `docs/affiliate-operations.md` · `docs/deployment.md`
- `docs/launch-checklist.md` · `docs/known-limitations.md`

## Deployment

See `docs/deployment.md`. No production deployment or paid usage without explicit
approval.
