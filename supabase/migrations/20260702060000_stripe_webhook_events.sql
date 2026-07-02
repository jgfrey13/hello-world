-- Stripe webhook idempotency ledger (Phase 7).
-- One row per processed Stripe event id; the webhook inserts before applying
-- side effects, so a redelivered event hits the primary key and is skipped.
-- Service-role only; no user-facing policies.

create table public.stripe_webhook_events (
  id text primary key, -- Stripe event id (evt_…)
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
