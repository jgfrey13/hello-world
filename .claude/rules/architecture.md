# Rule: Architecture

## Layering (strict)

```
UI (RSC / client components)
  → Server Actions / Route Handlers   (auth check + Zod validation happen here)
    → lib/ services                    (business logic, one module per concern)
      → Supabase (RLS-enforced Postgres)
```

- **No business logic in UI components.** Components render; they call actions/services.
- **No raw DB queries outside `lib/database`.** All reads/writes go through typed
  service functions so authorization, joins, and shape stay consistent.
- **Every server action and route handler** validates input with the entity's
  shared Zod schema and performs a server-side authorization check before doing work.
- **All responses are typed.** No untyped API payloads.

## Directory conventions

- `app/(public)/` — public marketing/directory pages (RSC, cached where safe).
- `app/admin/` — admin app (server-guarded, `noindex`).
- `app/brand-dashboard/` — brand-owner app (server-guarded, `noindex`).
- `app/api/` — route handlers (webhooks, redirects, health).
- `app/auth/` — auth flows.
- `lib/` — `auth`, `database`, `affiliate`, `analytics`, `validation`, `security`,
  `seo`, `email`. Each is the single home for its concern.
- `components/` — grouped by domain (`brands`, `products`, `articles`, `search`,
  `admin`, `forms`, `analytics`, `ui`). One component per pattern — no duplicate
  incompatible versions.

## Rendering & data

- Server Components fetch data directly via `lib/database`. Client components are
  used only where interactivity requires it (filters, forms, dialogs).
- Mutations use Server Actions; external integrations (Stripe webhook, `/go`
  redirect, health) use Route Handlers.
- Search/filter state lives in URL query params (shareable, server-read).

## Avoid

Giant page components, business logic in UI, duplicated validation, scattered DB
calls, untyped responses, unnecessary abstractions, premature microservices.
