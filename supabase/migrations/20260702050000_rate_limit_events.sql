-- Serverless-safe rate limiting for public forms (Phase 5).
-- One row per accepted request; the limiter counts rows for a hashed key
-- within a sliding window. Written only by trusted server code (service
-- role); no user-facing policies. Keys are salted hashes — never raw IPs.

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  key_hash text not null,
  occurred_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (bucket, key_hash, occurred_at);

alter table public.rate_limit_events enable row level security;

-- Housekeeping helper: prune old events (call from a scheduled job later).
create or replace function public.prune_rate_limit_events(older_than interval)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_events where occurred_at < now() - older_than;
$$;

revoke execute on function public.prune_rate_limit_events(interval) from public, anon, authenticated;
