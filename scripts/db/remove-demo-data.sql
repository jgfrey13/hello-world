-- Removes all fictional demo data loaded by supabase/seed.sql.
-- Cascades take care of children (products, evidence, locations, joins).
-- Run via: npm run db:seed:remove

begin;

delete from public.articles where is_demo;
delete from public.brands where is_demo;      -- cascades products/evidence/locations/links
delete from public.products where is_demo;    -- any demo products under non-demo brands
delete from public.categories where is_demo;

commit;
