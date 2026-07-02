-- MadeHere storage buckets and object policies.
-- brand-media: public-read product/brand imagery, written by staff (brand-owner
--   uploads land in Phase 6 through server code that validates MIME/size).
-- claim-proofs: PRIVATE proof-of-affiliation uploads; each user writes to a
--   folder named by their user id and reads only their own files; admins read
--   everything for claim review. MIME/size limits are enforced at the bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'brand-media', 'brand-media', true,
    5242880, -- 5 MiB
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
  ),
  (
    'claim-proofs', 'claim-proofs', false,
    10485760, -- 10 MiB
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

-- brand-media: anyone can read; only editors/admins write (service role for
-- automated paths bypasses RLS).
create policy "brand media public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'brand-media');

create policy "brand media staff insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-media' and public.is_editor_or_admin());

create policy "brand media staff update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand-media' and public.is_editor_or_admin())
  with check (bucket_id = 'brand-media' and public.is_editor_or_admin());

create policy "brand media admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-media' and public.is_admin());

-- claim-proofs: user writes/reads only under their own {user_id}/ prefix;
-- admins read all for review. No public access ever.
create policy "claim proofs own insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'claim-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "claim proofs own or admin read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'claim-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "claim proofs admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'claim-proofs' and public.is_admin());
