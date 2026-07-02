-- MadeHere row-level security.
-- Baseline (see .claude/rules/database.md):
--   anon/authenticated read only PUBLISHED rows of public tables;
--   internal notes, unreviewed evidence, submitter PII, and the audit log are
--   never publicly readable; brand owners write only via pending-submission
--   tables; role/billing writes are admin-only; the service role (trusted
--   server code) bypasses RLS entirely.
-- Public forms (brand_submissions, corrections, newsletter, analytics,
-- affiliate clicks) are written by trusted server code using the service role,
-- never by direct anon inserts — so those tables carry no anon policies.

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.brand_categories enable row level security;
alter table public.brand_owners enable row level security;
alter table public.products enable row level security;
alter table public.manufacturing_evidence enable row level security;
alter table public.manufacturing_locations enable row level security;
alter table public.articles enable row level security;
alter table public.article_brands enable row level security;
alter table public.article_products enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.brand_claims enable row level security;
alter table public.brand_submissions enable row level security;
alter table public.proposed_changes enable row level security;
alter table public.corrections enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.sponsorships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
-- (Self role changes are additionally blocked by the profiles_role_admin_only
--  trigger; admins manage other users' rows through it.)

-- ---------------------------------------------------------------------------
-- categories: public sees active; editors/admins manage
-- ---------------------------------------------------------------------------

create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_active or public.is_editor_or_admin());

create policy categories_staff_insert on public.categories
  for insert to authenticated
  with check (public.is_editor_or_admin());

create policy categories_staff_update on public.categories
  for update to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create policy categories_admin_delete on public.categories
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- brands: public sees published; owners additionally see their own brands;
-- editors manage non-published rows; admins manage everything.
-- Publishing (status -> 'published') is admin-only.
-- ---------------------------------------------------------------------------

create policy brands_public_read on public.brands
  for select to anon, authenticated
  using (
    status = 'published'
    or public.is_editor_or_admin()
    or public.is_owner_of_brand(id)
  );

create policy brands_staff_insert on public.brands
  for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status in ('draft', 'pending_review'))
  );

create policy brands_editor_update_unpublished on public.brands
  for update to authenticated
  using (public.is_editor_or_admin() and status <> 'published')
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status <> 'published')
  );

create policy brands_admin_update on public.brands
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy brands_admin_delete on public.brands
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- brand_categories: visible when the brand is visible; staff manage
-- ---------------------------------------------------------------------------

create policy brand_categories_public_read on public.brand_categories
  for select to anon, authenticated
  using (
    public.is_editor_or_admin()
    or exists (
      select 1 from public.brands b
      where b.id = brand_id and b.status = 'published'
    )
  );

create policy brand_categories_staff_write on public.brand_categories
  for all to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- brand_owners: owners see their own grants; admins manage.
-- Never insertable by the claiming user — approval happens in admin server
-- code (service role) when a claim is approved.
-- ---------------------------------------------------------------------------

create policy brand_owners_select_own on public.brand_owners
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy brand_owners_admin_write on public.brand_owners
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products: same visibility model as brands; owners see their brand's
-- products (including drafts) but have NO direct write policies — owner edits
-- flow through proposed_changes.
-- ---------------------------------------------------------------------------

create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    status = 'published'
    or public.is_editor_or_admin()
    or public.is_owner_of_brand(brand_id)
  );

create policy products_staff_insert on public.products
  for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status in ('draft', 'pending_review'))
  );

create policy products_editor_update_unpublished on public.products
  for update to authenticated
  using (public.is_editor_or_admin() and status <> 'published')
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status <> 'published')
  );

create policy products_admin_update on public.products
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy products_admin_delete on public.products
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- manufacturing_evidence: the public NEVER reads this table directly (that
-- would expose internal_notes and unreviewed evidence). Approved evidence is
-- exposed through the public_evidence view below. Brand owners may read
-- non-internal fields of their own brand's evidence via the view as well;
-- direct table access is staff-only.
-- ---------------------------------------------------------------------------

create policy evidence_staff_read on public.manufacturing_evidence
  for select to authenticated
  using (public.is_editor_or_admin());

create policy evidence_staff_insert on public.manufacturing_evidence
  for insert to authenticated
  with check (
    public.is_editor_or_admin()
    and review_status = 'pending'
    or public.is_admin()
  );

create policy evidence_owner_submit on public.manufacturing_evidence
  for insert to authenticated
  with check (
    public.is_owner_of_brand(brand_id)
    and review_status = 'pending'
    and internal_notes is null
  );

create policy evidence_staff_update on public.manufacturing_evidence
  for update to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());
-- (Approval transitions additionally require admin via the
--  evidence_review_admin_only trigger, and approved rows must carry a source
--  by check constraint.)

create policy evidence_admin_delete on public.manufacturing_evidence
  for delete to authenticated
  using (public.is_admin());

-- Public, safe projection of evidence: approved rows only, no internal notes.
-- security_invoker = false (definer) is intentional: the view is the public
-- boundary and its columns are the whitelist.
create view public.public_evidence
with (security_invoker = false) as
  select
    e.id,
    e.brand_id,
    e.product_id,
    e.classification,
    e.source_url,
    e.source_title,
    e.evidence_note,
    e.evidence_type,
    e.accessed_at,
    e.confidence_score,
    e.reviewed_at,
    e.last_verified_at,
    e.dispute_status
  from public.manufacturing_evidence e
  where e.review_status = 'approved';

grant select on public.public_evidence to anon, authenticated;

-- ---------------------------------------------------------------------------
-- manufacturing_locations: public sees locations of published brands
-- ---------------------------------------------------------------------------

create policy locations_public_read on public.manufacturing_locations
  for select to anon, authenticated
  using (
    public.is_editor_or_admin()
    or exists (
      select 1 from public.brands b
      where b.id = brand_id and b.status = 'published'
    )
  );

create policy locations_staff_write on public.manufacturing_locations
  for all to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- articles + join tables
-- ---------------------------------------------------------------------------

create policy articles_public_read on public.articles
  for select to anon, authenticated
  using (status = 'published' or public.is_editor_or_admin());

create policy articles_staff_insert on public.articles
  for insert to authenticated
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status in ('draft', 'pending_review'))
  );

create policy articles_editor_update_unpublished on public.articles
  for update to authenticated
  using (public.is_editor_or_admin() and status <> 'published')
  with check (
    public.is_admin()
    or (public.is_editor_or_admin() and status <> 'published')
  );

create policy articles_admin_update on public.articles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy articles_admin_delete on public.articles
  for delete to authenticated
  using (public.is_admin());

create policy article_brands_public_read on public.article_brands
  for select to anon, authenticated
  using (
    public.is_editor_or_admin()
    or exists (
      select 1 from public.articles a
      where a.id = article_id and a.status = 'published'
    )
  );

create policy article_brands_staff_write on public.article_brands
  for all to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

create policy article_products_public_read on public.article_products
  for select to anon, authenticated
  using (
    public.is_editor_or_admin()
    or exists (
      select 1 from public.articles a
      where a.id = article_id and a.status = 'published'
    )
  );

create policy article_products_staff_write on public.article_products
  for all to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- ---------------------------------------------------------------------------
-- affiliate_clicks: written by the /go route via service role; admins read.
-- Brand owners see aggregate counts through server code, not raw rows.
-- ---------------------------------------------------------------------------

create policy affiliate_clicks_admin_read on public.affiliate_clicks
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- brand_claims: authenticated users create their own PENDING claims and see
-- their own; admins review. A claim grants nothing by itself.
-- ---------------------------------------------------------------------------

create policy brand_claims_insert_own on public.brand_claims
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy brand_claims_select_own on public.brand_claims
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy brand_claims_admin_update on public.brand_claims
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy brand_claims_admin_delete on public.brand_claims
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- brand_submissions / corrections: service-role writes (rate-limited server
-- forms); admin review. No public read — submitter PII stays private.
-- ---------------------------------------------------------------------------

create policy brand_submissions_admin_all on public.brand_submissions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy corrections_admin_all on public.corrections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- proposed_changes: owners submit pending changes for their brands/products
-- and see their own; admins review.
-- ---------------------------------------------------------------------------

create policy proposed_changes_owner_insert on public.proposed_changes
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and (
      (brand_id is not null and public.is_owner_of_brand(brand_id))
      or (product_id is not null and exists (
        select 1 from public.products p
        where p.id = product_id and public.is_owner_of_brand(p.brand_id)
      ))
    )
  );

create policy proposed_changes_select_own on public.proposed_changes
  for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());

create policy proposed_changes_admin_update on public.proposed_changes
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy proposed_changes_admin_delete on public.proposed_changes
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- newsletter_subscribers: service-role only for signup; admin read.
-- Never publicly readable.
-- ---------------------------------------------------------------------------

create policy newsletter_admin_read on public.newsletter_subscribers
  for select to authenticated
  using (public.is_admin());

create policy newsletter_admin_update on public.newsletter_subscribers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- sponsorships: admin-managed. Public pages read sponsor flags on
-- brands/articles, not this table.
-- ---------------------------------------------------------------------------

create policy sponsorships_admin_all on public.sponsorships
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions: owners see their brand's subscription; all writes happen in
-- trusted server code (Stripe webhooks) via service role; admins read.
-- No user-writable policies — paid status can never be self-granted.
-- ---------------------------------------------------------------------------

create policy subscriptions_owner_read on public.subscriptions
  for select to authenticated
  using (public.is_owner_of_brand(brand_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- analytics_events: service-role writes; admin reads.
-- ---------------------------------------------------------------------------

create policy analytics_admin_read on public.analytics_events
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log: admin read only. Append-only: no update/delete policies exist,
-- and writes happen via triggers/service role.
-- ---------------------------------------------------------------------------

create policy audit_log_admin_read on public.audit_log
  for select to authenticated
  using (public.is_admin());
