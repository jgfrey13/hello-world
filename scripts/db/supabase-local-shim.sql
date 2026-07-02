-- LOCAL VALIDATION SHIM — never run against a real Supabase project.
--
-- Real Supabase provisions the auth/storage schemas, the anon/authenticated/
-- service_role roles, and auth.uid() natively. This shim recreates the minimum
-- of that surface on a plain Postgres so the migrations in
-- supabase/migrations/ can be applied and the RLS test suite can run locally
-- (see tests/integration/rls.test.ts). It mirrors Supabase behavior:
-- auth.uid() reads the request.jwt.claims 'sub' claim.

-- Runtime guard: a real Supabase database carries the supabase_admin role
-- (and an auth.users owned by it). Overwriting real auth infrastructure with
-- this shim would be destructive, so abort hard if we detect one.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_admin')
     or exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    raise exception
      'supabase-local-shim.sql must never run against a real Supabase database';
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage on sequences to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  -- The GUC may be NULL (never set) or '' (reset after transaction rollback);
  -- guard before casting to jsonb, exactly like Supabase's implementation.
  select nullif(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    ''
  )::uuid;
$$;

-- Minimal storage schema so the storage migration applies locally.
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1 : array_upper(string_to_array(name, '/'), 1) - 1];
$$;
