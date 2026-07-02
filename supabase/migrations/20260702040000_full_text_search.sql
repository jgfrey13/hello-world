-- Full-text search columns for the public directory (Phase 3).
-- Generated tsvector columns let PostgREST/supabase-js run websearch queries
-- (.textSearch) without raw SQL. Replaces the Phase-2 expression indexes,
-- which supabase-js cannot target.

alter table public.brands
  add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(headquarters_state, '')), 'C')
  ) stored;

create index brands_search_tsv_idx on public.brands using gin (search_tsv);
drop index if exists public.brands_name_search_idx;

alter table public.products
  add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(materials, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(manufacturing_state, '')), 'C')
  ) stored;

create index products_search_tsv_idx on public.products using gin (search_tsv);
drop index if exists public.products_search_idx;
