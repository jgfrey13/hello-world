# Architecture — MadeHere

## Overview

MadeHere is a Next.js (App Router) application backed by Supabase Postgres. It is
an evidence-based consumer discovery and affiliate-commerce platform for
American-made products. Public pages are Server Components reading from the
database through typed service functions; mutations use Server Actions; external
integrations (Stripe webhook, affiliate redirect, health) use Route Handlers.

## Layering

```
UI (RSC / client components)
  → Server Actions / Route Handlers   — authorization + Zod validation
    → lib/ services                    — business logic (one module per concern)
      → Supabase (RLS-enforced Postgres, Auth, Storage)
```

Authorization is enforced twice: in server code (per action/route) and in the
database (RLS). UI hiding is never the security boundary.

## Repository structure

```
app/
  (public)/        home, brands, products, categories, guides, articles, policy,
                   about, methodology, pricing, submit, claim, correction
  admin/           protected admin app (noindex)
  brand-dashboard/ protected brand-owner app (noindex)
  api/             route handlers: /api/stripe/webhook, /api/health
  auth/            auth flows
  go/[slug]/       affiliate redirect route handler
components/
  brands/ products/ articles/ search/ admin/ forms/ analytics/ ui/
lib/
  auth/ database/ affiliate/ analytics/ validation/ security/ seo/ email/
supabase/
  migrations/ seed.sql tests/
tests/
  unit/ integration/ e2e/
docs/
.claude/
  rules/ agents/
```

## Key modules

- `lib/database` — the only place raw Supabase queries live. Exposes typed
  functions per entity (e.g. `getPublishedBrands`, `getBrandBySlug`,
  `createBrandSubmission`). Uses generated types from `lib/database/types.ts`.
- `lib/validation` — one Zod schema per entity, reused by forms, actions, routes.
- `lib/auth` — session/role helpers; `requireRole()` guards for server code.
- `lib/affiliate` — destination validation + click recording for `/go/[slug]`.
- `lib/analytics` — first-party event recording (views, clicks, conversions).
- `lib/security` — env validation, rate limiting, redirect allowlisting, headers.
- `lib/seo` — metadata builders, structured data, sitemap, indexability gate.
- `lib/email` — Resend wrappers for transactional notifications.

## Data flow examples

- **Directory page**: RSC calls `lib/database.searchBrands(params)` with filters
  parsed from URL query params → Postgres full-text + indexed filters + pagination
  → renders cards. No client-side full-table filtering.
- **Affiliate click**: `GET /go/[slug]` → look up published product → validate
  destination against allowlist → record privacy-conscious click → 302 to
  affiliate URL (fallback: direct purchase URL).
- **Stripe webhook**: `POST /api/stripe/webhook` → verify signature → idempotency
  check → update `subscriptions` via service-role server client → audit log.

## Rendering & performance

Server-side data fetching (RSC), cached public reads where safe, indexed filter
columns, avoidance of N+1 via batched queries in `lib/database`, appropriate
image sizing, minimal client JS. Measure before speculative optimization; record
bottlenecks in `docs/known-limitations.md`.

## Page map & permission matrix

See `docs/database.md` for the entity model, this file's structure section for the
page map, and `.claude/rules/security.md` + the permission matrix below.

| Action                                 | Visitor | Brand owner | Editor | Admin |
| -------------------------------------- | ------- | ----------- | ------ | ----- |
| Read published records                 | ✓       | ✓           | ✓      | ✓     |
| Newsletter / submit brand / correction | ✓       | ✓           | ✓      | ✓     |
| Claim profile (auth required)          | –       | ✓           | ✓      | ✓     |
| Propose brand/product edits (pending)  | –       | ✓ own       | ✓      | ✓     |
| Manage drafts / recommend publish      | –       | –           | ✓      | ✓     |
| Publish / edit classification          | –       | ✗           | ✗      | ✓     |
| Approve evidence                       | –       | ✗           | ✗      | ✓     |
| Manage roles / billing metadata        | –       | ✗           | ✗      | ✓     |
