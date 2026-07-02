-- Data-ingestion foundation (Phase 9): CSV import jobs, the research
-- pipeline, and link-check results. Staff-only tables — nothing here is
-- public, and nothing auto-publishes (see docs/import-process.md).

create type public.ingestion_status as enum (
  'discovered', 'queued', 'fetched', 'extracted', 'normalized', 'matched',
  'drafted', 'needs_review', 'approved', 'published', 'rejected', 'failed'
);

create type public.import_job_status as enum
  ('pending_review', 'committed', 'discarded');

-- CSV import jobs: parsed rows + per-row validation stored for preview;
-- committing creates DRAFT brands only.
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  entity text not null default 'brands',
  status public.import_job_status not null default 'pending_review',
  row_count integer not null default 0,
  valid_count integer not null default 0,
  committed_count integer not null default 0,
  rows jsonb not null default '[]'::jsonb, -- [{data, issues: [..], ok}]
  created_by uuid references auth.users (id) on delete set null,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_jobs_status_idx on public.import_jobs (status);

create trigger import_jobs_updated_at
  before update on public.import_jobs
  for each row execute function public.set_updated_at();

-- Research pipeline records: candidate sources and their lifecycle.
-- AI output is never evidence; these records carry sources for humans.
create table public.ingestion_records (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_note text,
  candidate_name text,
  normalized_domain text,
  brand_id uuid references public.brands (id) on delete set null,
  status public.ingestion_status not null default 'discovered',
  field_confidence jsonb,
  last_checked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingestion_records_status_idx on public.ingestion_records (status);
create index ingestion_records_domain_idx on public.ingestion_records (normalized_domain);

create trigger ingestion_records_updated_at
  before update on public.ingestion_records
  for each row execute function public.set_updated_at();

-- Broken-link checks: written by the scheduled job, reviewed by staff.
create table public.link_check_results (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  url text not null,
  ok boolean not null,
  status_code integer,
  checked_at timestamptz not null default now()
);

create index link_check_results_product_idx on public.link_check_results (product_id);
create index link_check_results_ok_idx on public.link_check_results (ok, checked_at);

-- RLS: staff-only surfaces.
alter table public.import_jobs enable row level security;
alter table public.ingestion_records enable row level security;
alter table public.link_check_results enable row level security;

create policy import_jobs_admin_all on public.import_jobs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy ingestion_records_staff_read on public.ingestion_records
  for select to authenticated
  using (public.is_editor_or_admin());

create policy ingestion_records_staff_insert on public.ingestion_records
  for insert to authenticated
  with check (public.is_editor_or_admin());

create policy ingestion_records_staff_update on public.ingestion_records
  for update to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create policy link_checks_staff_read on public.link_check_results
  for select to authenticated
  using (public.is_editor_or_admin());
