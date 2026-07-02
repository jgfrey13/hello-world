-- Corrective migration (Phase 10 security review, finding M3 + SVG hardening).
--
-- 1. brands carries several columns that must only ever change through admin
--    action: verification_status (an evidence outcome), subscription_tier
--    (billing state, written by the trusted Stripe sync path), and the
--    is_featured / is_sponsored placement flags. RLS already limits *which
--    rows* editors can update, but not *which columns* — this trigger closes
--    that gap the same way profiles.role and products.manufacturing_
--    classification are protected. Trusted contexts (service role, direct
--    connections) bypass it via request_is_api() and are governed by server
--    code instead.
--
-- 2. brand-media allowed SVG uploads. SVG can carry active content (scripts,
--    foreign references) and the bucket is public-read, so it is removed from
--    the allowlist. Raster formats remain.

create or replace function public.enforce_brand_admin_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.verification_status is distinct from old.verification_status
      or new.subscription_tier is distinct from old.subscription_tier
      or new.is_featured is distinct from old.is_featured
      or new.is_sponsored is distinct from old.is_sponsored)
     and public.request_is_api()
     and not public.is_admin() then
    raise exception
      'verification, subscription tier, and placement flags are admin-only';
  end if;
  return new;
end;
$$;

create trigger brands_admin_columns_admin_only
  before update on public.brands
  for each row execute function public.enforce_brand_admin_columns();

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'brand-media';
