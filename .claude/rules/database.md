# Rule: Database

## Every table

- UUID primary key (`gen_random_uuid()`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` (trigger-maintained)
- Foreign-key constraints with explicit `on delete` behavior
- Indexes on slug, foreign keys, and columns used in filters/sorts
- Check constraints on enum-like columns (or Postgres enums)
- Status/archival control where records have a lifecycle
- **RLS enabled** with explicit policies

## Migrations

- One change = one new migration file in `supabase/migrations/` (timestamp-named).
- Never edit an applied migration. Add a corrective migration instead.
- Regenerate `lib/database/types.ts` after every schema change.
- Keep `supabase/seed.sql` (fictional, clearly-labeled demo data) in sync with schema.

## RLS baseline

- Public (anon) role: `select` only on **published** rows of public tables; no
  access to `internal_notes`, unreviewed evidence, submitter PII, audit log.
- Authenticated brand owners: access only to brands they are approved for, and
  only via pending-submission tables — never direct writes to published
  classification/evidence/editorial fields.
- Editors: manage drafts and recommend; cannot touch roles or billing.
- Admin: full management via service paths; role/billing changes admin-only.
- Service-role key is used **only** in trusted server code (webhooks, admin
  server actions), never shipped to the client.

## Classification integrity

`manufacturing_classification` is admin-controlled. It is not writable by brand
owners or by any billing/subscription flow. Evidence rows require a source URL
(check constraint / validation) before they can reach `approved`.
