# Deployment — MadeHere

> No production deployment or paid usage without explicit approval.

## Targets

- **App**: Vercel (Next.js App Router) or equivalent host.
- **Database/Auth/Storage**: Supabase project (staging + production).
- **Payments**: Stripe (test mode first; production only after gate below).
- **Email**: Resend (authenticated sender domain before any bulk send).
- **Source**: GitHub.

## Environments

- **Local**: local Supabase (Docker) or a dev Supabase project; Stripe test mode;
  `.env.local` from `.env.example`.
- **Staging**: separate Supabase project + Stripe test mode + Resend sandbox.
- **Production**: gated (see below).

## Environment variables

See `.env.example`. Validated at startup by a Zod env schema (`lib/security`);
the app fails fast if a required variable is missing. Service-role/Stripe/Resend
secrets are server-only.

## Database setup

```bash
npm run db:migrate     # apply migrations in supabase/migrations
npm run db:types       # regenerate lib/database/types.ts
npm run db:seed        # optional fictional demo data
```

## Stripe

- Configure products/prices; set `STRIPE_PRICE_VERIFIED` / `STRIPE_PRICE_FEATURED`.
- Register the production webhook endpoint (`/api/stripe/webhook`) and set
  `STRIPE_WEBHOOK_SECRET`.
- Verify signatures; process idempotently.

## Scheduled jobs

Set `CRON_SECRET` (long random string) and point a scheduler at the job
endpoints with `Authorization: Bearer $CRON_SECRET`:

| Job                                       | Endpoint                           | Suggested cadence |
| ----------------------------------------- | ---------------------------------- | ----------------- |
| Prune rate-limit events (7-day retention) | `POST /api/jobs/prune_rate_limits` | daily             |
| Check outbound product links (25/run)     | `POST /api/jobs/check_links`       | hourly            |

On Vercel, use Vercel Cron with these paths. Jobs are disabled (401) until
`CRON_SECRET` is set. Broken links surface on `/admin/research` for staff
review — nothing is auto-archived.

## End-to-end tests

- `npm run test:e2e` — local mode: starts the production build without a
  database and runs accessibility (axe, WCAG 2.1 A/AA) + keyboard +
  graceful-degradation specs. In environments with a preinstalled Chromium,
  set `PLAYWRIGHT_CHROMIUM_PATH` to its executable.
- `E2E_BASE_URL=https://staging.example npm run test:e2e` — full-stack mode
  against a seeded deployment: enables the directory/search/redirect/
  submission/authorization flow specs.

## Production go-live gate

Do not enable production payments or bulk email until:

- Final prices approved.
- Legal/policy pages reviewed by qualified counsel.
- Custom domain active.
- Production webhook endpoints configured and tested.
- Refund/cancellation procedures documented.
- Test transactions passed.
- Sender-domain authentication complete; unsubscribe verified.
- Security, accessibility, SEO, and performance reviews passed.
- Backup procedure documented.

## Backups & rollback

Supabase automated backups enabled; document restore procedure. App rollbacks via
host's immutable deployments. Migrations are forward-only (corrective migrations,
never edits to applied ones).
