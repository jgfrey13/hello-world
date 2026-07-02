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
