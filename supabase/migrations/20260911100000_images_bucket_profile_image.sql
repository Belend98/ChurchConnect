insert into storage.buckets (id, name, public)
values ('church-images', 'church-images', true)
on conflict (id) do update
set public = true;

alter table public.user_profil
add column if not exists image_url text;

drop policy if exists "church_images_select_authenticated" on storage.objects;
drop policy if exists "church_images_profile_insert_own" on storage.objects;
drop policy if exists "church_images_profile_update_own" on storage.objects;
drop policy if exists "church_images_profile_delete_own" on storage.objects;
drop policy if exists "church_images_predication_insert_staff" on storage.objects;
drop policy if exists "church_images_predication_update_staff" on storage.objects;
drop policy if exists "church_images_predication_delete_staff" on storage.objects;

create policy "church_images_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'church-images');

create policy "church_images_profile_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'church-images'
  and name like ('profiles/' || auth.uid() || '/%')
);

create policy "church_images_profile_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'church-images'
  and name like ('profiles/' || auth.uid() || '/%')
)
with check (
  bucket_id = 'church-images'
  and name like ('profiles/' || auth.uid() || '/%')
);

create policy "church_images_profile_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'church-images'
  and name like ('profiles/' || auth.uid() || '/%')
);

create policy "church_images_predication_insert_staff"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'church-images'
  and name like 'predications/%'
  and public.can_manage_predications()
);

create policy "church_images_predication_update_staff"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'church-images'
  and name like 'predications/%'
  and public.can_manage_predications()
)
with check (
  bucket_id = 'church-images'
  and name like 'predications/%'
  and public.can_manage_predications()
);

create policy "church_images_predication_delete_staff"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'church-images'
  and name like 'predications/%'
  and public.can_manage_predications()
);
