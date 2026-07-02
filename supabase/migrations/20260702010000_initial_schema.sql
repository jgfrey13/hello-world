-- MadeHere initial schema.
-- Conventions (see .claude/rules/database.md): UUID PKs, created_at/updated_at
-- (trigger-maintained), explicit FKs, indexes on slugs/FKs/filter columns,
-- enums for lifecycle columns, RLS enabled in the companion policies migration.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('visitor', 'brand_owner', 'editor', 'admin');

create type public.content_status as enum
  ('draft', 'pending_review', 'published', 'rejected', 'archived');

create type public.manufacturing_classification as enum (
  'verified_made_in_usa',
  'brand_reported_made_in_usa',
  'made_in_usa_imported_components',
  'assembled_in_usa',
  'certain_products_made_in_usa',
  'designed_in_usa_manufactured_elsewhere',
  'us_owned_unconfirmed_manufacturing',
  'unclear',
  'awaiting_review'
);

create type public.evidence_review_status as enum
  ('pending', 'approved', 'rejected', 'needs_more_information');

create type public.review_outcome_status as enum
  ('pending', 'approved', 'rejected');

create type public.article_type as enum (
  'shopping_guide', 'brand_story', 'founder_story', 'factory_story',
  'comparison', 'buying_guide', 'news'
);

create type public.subscription_plan as enum ('basic', 'verified', 'featured');

create type public.subscription_status as enum (
  'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
);

create type public.evidence_type as enum (
  'brand_statement', 'product_page', 'factory_documentation', 'press_coverage',
  'regulatory_filing', 'third_party_audit', 'direct_correspondence', 'other'
);

create type public.dispute_status as enum ('none', 'disputed', 'resolved');

create type public.location_type as enum
  ('factory', 'workshop', 'assembly_plant', 'headquarters', 'warehouse', 'other');

create type public.destination_type as enum ('affiliate', 'direct');

create type public.subscriber_status as enum ('active', 'unsubscribed');

create type public.sponsorship_status as enum
  ('scheduled', 'active', 'completed', 'canceled');

create type public.analytics_event_type as enum (
  'brand_view', 'product_view', 'article_view', 'affiliate_click',
  'newsletter_signup', 'brand_submission', 'brand_claim'
);

-- ---------------------------------------------------------------------------
-- Helper: trigger-maintained updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users; role is admin-managed)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  organization text,
  job_title text,
  role public.user_role not null default 'visitor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when an auth user is created (Supabase pattern).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers used by RLS policies and triggers. SECURITY DEFINER so they can
-- read profiles regardless of the caller's own row visibility.
create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'visitor'::public.user_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('editor', 'admin');
$$;

-- True when the statement originates from an end-user API request (PostgREST
-- sets JWT claims). False for trusted contexts — direct connections
-- (migrations, admin bootstrap) and service-role requests — which are
-- governed by server code instead.
create or replace function public.request_is_api()
returns boolean
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) not in ('', 'service_role');
$$;

-- No user may change their own role; role assignment is admin-only.
-- (Database-level enforcement; server code checks too.)
create or replace function public.enforce_role_change_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and public.request_is_api()
     and not public.is_admin() then
    raise exception 'role changes are admin-only';
  end if;
  return new;
end;
$$;

create trigger profiles_role_admin_only
  before update on public.profiles
  for each row execute function public.enforce_role_change_admin_only();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  parent_category_id uuid references public.categories (id) on delete set null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_category_id);
create index categories_active_order_idx on public.categories (is_active, display_order);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  summary text,
  full_description text,
  website_url text,
  logo_path text,
  hero_image_path text,
  founded_year integer check (founded_year is null or founded_year between 1600 and 2100),
  founder_names text,
  ownership_type text,
  headquarters_city text,
  headquarters_state text,
  headquarters_country text not null default 'US',
  price_level smallint check (price_level is null or price_level between 1 and 3),
  status public.content_status not null default 'draft',
  verification_status public.review_outcome_status not null default 'pending',
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  subscription_tier public.subscription_plan not null default 'basic',
  is_demo boolean not null default false,
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brands_status_idx on public.brands (status);
create index brands_state_idx on public.brands (headquarters_state);
create index brands_featured_idx on public.brands (is_featured) where is_featured;
create index brands_name_search_idx on public.brands
  using gin (to_tsvector('english', name || ' ' || coalesce(summary, '')));

create trigger brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_categories (m:n)
-- ---------------------------------------------------------------------------

create table public.brand_categories (
  brand_id uuid not null references public.brands (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (brand_id, category_id)
);

create index brand_categories_category_idx on public.brand_categories (category_id);

-- ---------------------------------------------------------------------------
-- brand_owners: which authenticated users manage which brands.
-- Rows are created by admins when a brand claim is approved — never by the
-- claiming user. This table is the authorization source for owner access.
-- ---------------------------------------------------------------------------

create table public.brand_owners (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, user_id)
);

create index brand_owners_user_idx on public.brand_owners (user_id);

create trigger brand_owners_updated_at
  before update on public.brand_owners
  for each row execute function public.set_updated_at();

create or replace function public.is_owner_of_brand(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.brand_owners
    where brand_id = target_brand and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  summary text,
  description text,
  image_path text,
  price_amount numeric(12, 2) check (price_amount is null or price_amount >= 0),
  price_currency char(3) not null default 'USD',
  price_is_approximate boolean not null default true,
  price_verified_at timestamptz,
  direct_purchase_url text,
  affiliate_url text,
  affiliate_network text,
  affiliate_disclosure_required boolean not null default true,
  manufacturing_classification public.manufacturing_classification
    not null default 'awaiting_review',
  manufacturing_city text,
  manufacturing_state text,
  manufacturing_country text,
  materials text,
  imported_components_note text,
  warranty_summary text,
  shipping_summary text,
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  is_sponsored boolean not null default false,
  is_demo boolean not null default false,
  last_reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_brand_idx on public.products (brand_id);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_classification_idx on public.products (manufacturing_classification);
create index products_state_idx on public.products (manufacturing_state);
create index products_search_idx on public.products
  using gin (to_tsvector('english', name || ' ' || coalesce(summary, '')));

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Classification integrity: manufacturing_classification is admin-controlled.
-- Not writable by brand owners, editors, or any billing flow. The service role
-- (trusted server code) bypasses this via the explicit role check.
create or replace function public.enforce_classification_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.manufacturing_classification is distinct from old.manufacturing_classification
     and public.request_is_api()
     and not public.is_admin() then
    raise exception 'manufacturing_classification changes are admin-only';
  end if;
  return new;
end;
$$;

create trigger products_classification_admin_only
  before update on public.products
  for each row execute function public.enforce_classification_admin_only();

-- ---------------------------------------------------------------------------
-- manufacturing_evidence
-- ---------------------------------------------------------------------------

create table public.manufacturing_evidence (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  classification public.manufacturing_classification not null,
  source_url text,
  source_title text,
  evidence_note text,
  evidence_type public.evidence_type not null default 'other',
  accessed_at timestamptz,
  confidence_score smallint
    check (confidence_score is null or confidence_score between 0 and 100),
  review_status public.evidence_review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  last_verified_at timestamptz,
  dispute_status public.dispute_status not null default 'none',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Evidence can never be approved without a source and a recorded reviewer.
  constraint evidence_approved_requires_source check (
    review_status <> 'approved'
    or (source_url is not null and reviewed_by is not null and reviewed_at is not null)
  )
);

create index evidence_brand_idx on public.manufacturing_evidence (brand_id);
create index evidence_product_idx on public.manufacturing_evidence (product_id);
create index evidence_review_status_idx on public.manufacturing_evidence (review_status);

create trigger evidence_updated_at
  before update on public.manufacturing_evidence
  for each row execute function public.set_updated_at();

-- Evidence approval/rejection decisions are admin-only.
create or replace function public.enforce_evidence_review_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.review_status is distinct from old.review_status
     and public.request_is_api()
     and not public.is_admin() then
    raise exception 'evidence review decisions are admin-only';
  end if;
  return new;
end;
$$;

create trigger evidence_review_admin_only
  before update on public.manufacturing_evidence
  for each row execute function public.enforce_evidence_review_admin_only();

-- ---------------------------------------------------------------------------
-- manufacturing_locations
-- ---------------------------------------------------------------------------

create table public.manufacturing_locations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  facility_name text,
  address text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  location_type public.location_type not null default 'factory',
  source_url text,
  verification_status public.review_outcome_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_brand_idx on public.manufacturing_locations (brand_id);
create index locations_state_idx on public.manufacturing_locations (state);

create trigger locations_updated_at
  before update on public.manufacturing_locations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  featured_image_path text,
  article_type public.article_type not null,
  author_id uuid references auth.users (id) on delete set null,
  status public.content_status not null default 'draft',
  is_sponsored boolean not null default false,
  sponsor_brand_id uuid references public.brands (id) on delete set null,
  affiliate_disclosure_required boolean not null default true,
  seo_title text,
  seo_description text,
  is_demo boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Sponsored content must name its sponsor.
  constraint sponsored_articles_have_sponsor check (
    not is_sponsored or sponsor_brand_id is not null
  )
);

create index articles_status_idx on public.articles (status);
create index articles_type_idx on public.articles (article_type);
create index articles_sponsor_idx on public.articles (sponsor_brand_id);

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- article_brands / article_products (m:n)
-- ---------------------------------------------------------------------------

create table public.article_brands (
  article_id uuid not null references public.articles (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, brand_id)
);

create index article_brands_brand_idx on public.article_brands (brand_id);

create table public.article_products (
  article_id uuid not null references public.articles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  display_order integer not null default 0,
  editorial_label text,
  sponsorship_status text,
  created_at timestamptz not null default now(),
  primary key (article_id, product_id)
);

create index article_products_product_idx on public.article_products (product_id);

-- ---------------------------------------------------------------------------
-- affiliate_clicks (privacy-conscious: anonymous session id, no PII)
-- ---------------------------------------------------------------------------

create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  article_id uuid references public.articles (id) on delete set null,
  destination_type public.destination_type not null,
  destination_url text not null,
  referrer_path text,
  anonymous_session_id text,
  clicked_at timestamptz not null default now()
);

create index affiliate_clicks_product_idx on public.affiliate_clicks (product_id);
create index affiliate_clicks_brand_idx on public.affiliate_clicks (brand_id);
create index affiliate_clicks_clicked_at_idx on public.affiliate_clicks (clicked_at);

-- ---------------------------------------------------------------------------
-- brand_claims
-- ---------------------------------------------------------------------------

create table public.brand_claims (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  applicant_name text not null,
  company_email text not null,
  job_title text,
  proof_path text,
  comments text,
  status public.review_outcome_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_claims_brand_idx on public.brand_claims (brand_id);
create index brand_claims_user_idx on public.brand_claims (user_id);
create index brand_claims_status_idx on public.brand_claims (status);
-- One pending claim per user per brand.
create unique index brand_claims_one_pending
  on public.brand_claims (brand_id, user_id)
  where status = 'pending';

create trigger brand_claims_updated_at
  before update on public.brand_claims
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brand_submissions (public form; inserted via trusted server code)
-- ---------------------------------------------------------------------------

create table public.brand_submissions (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  website_url text not null,
  submitter_name text not null,
  submitter_email text not null,
  relationship_to_brand text,
  categories text[],
  description text,
  manufacturing_information text,
  evidence_url text,
  comments text,
  status public.review_outcome_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_submissions_status_idx on public.brand_submissions (status);
-- Duplicate-domain detection support.
create index brand_submissions_website_idx on public.brand_submissions (lower(website_url));

create trigger brand_submissions_updated_at
  before update on public.brand_submissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- proposed_changes (generic pending-change model for owner/editor edits)
-- ---------------------------------------------------------------------------

create table public.proposed_changes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  submitted_by uuid not null references auth.users (id) on delete cascade,
  change_type text not null,
  proposed_data jsonb not null,
  rationale text,
  source_url text,
  status public.review_outcome_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposed_changes_have_target check (
    brand_id is not null or product_id is not null
  )
);

create index proposed_changes_brand_idx on public.proposed_changes (brand_id);
create index proposed_changes_product_idx on public.proposed_changes (product_id);
create index proposed_changes_status_idx on public.proposed_changes (status);
create index proposed_changes_submitter_idx on public.proposed_changes (submitted_by);

create trigger proposed_changes_updated_at
  before update on public.proposed_changes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- corrections (public form; inserted via trusted server code)
-- ---------------------------------------------------------------------------

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  page_url text not null,
  issue_description text not null,
  proposed_correction text,
  supporting_source_url text,
  submitter_email text not null,
  status public.review_outcome_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index corrections_status_idx on public.corrections (status);
create index corrections_brand_idx on public.corrections (brand_id);

create trigger corrections_updated_at
  before update on public.corrections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  status public.subscriber_status not null default 'active',
  consent_at timestamptz not null default now(),
  consent_source text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalized uniqueness: one row per email address regardless of case.
create unique index newsletter_subscribers_email_unique
  on public.newsletter_subscribers (lower(email));

create trigger newsletter_subscribers_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sponsorships
-- ---------------------------------------------------------------------------

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  placement_type text not null,
  placement_location text,
  start_date date not null,
  end_date date,
  status public.sponsorship_status not null default 'scheduled',
  disclosure_text text,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsorship_dates_ordered check (
    end_date is null or end_date >= start_date
  )
);

create index sponsorships_brand_idx on public.sponsorships (brand_id);
create index sponsorships_status_idx on public.sponsorships (status);

create trigger sponsorships_updated_at
  before update on public.sponsorships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions (Stripe-synced by trusted server code only)
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  plan public.subscription_plan not null default 'basic',
  payment_provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  status public.subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_brand_idx on public.subscriptions (brand_id);
create index subscriptions_status_idx on public.subscriptions (status);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- analytics_events (restrained first-party analytics)
-- ---------------------------------------------------------------------------

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.analytics_event_type not null,
  brand_id uuid references public.brands (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  article_id uuid references public.articles (id) on delete set null,
  path text,
  anonymous_session_id text,
  occurred_at timestamptz not null default now()
);

create index analytics_events_type_time_idx
  on public.analytics_events (event_type, occurred_at);
create index analytics_events_brand_idx on public.analytics_events (brand_id);
create index analytics_events_product_idx on public.analytics_events (product_id);

-- ---------------------------------------------------------------------------
-- audit_log (sensitive administrative changes; no secrets, append-only)
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity, entity_id);
create index audit_log_actor_idx on public.audit_log (actor);
create index audit_log_created_idx on public.audit_log (created_at);

-- Audit role changes automatically.
create or replace function public.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into public.audit_log (actor, action, entity, entity_id, before_state, after_state)
    values (
      auth.uid(), 'role_change', 'profiles', new.id,
      jsonb_build_object('role', old.role),
      jsonb_build_object('role', new.role)
    );
  end if;
  return new;
end;
$$;

create trigger profiles_audit_role_change
  after update on public.profiles
  for each row execute function public.audit_role_change();
