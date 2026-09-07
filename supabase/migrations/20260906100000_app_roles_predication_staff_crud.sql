alter table public.user_profil
add column if not exists role_app text not null default 'membre';

update public.user_profil
set role_app = 'admin'
where is_admin = true
  and role_app = 'membre';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profil_role_app_check'
      and conrelid = 'public.user_profil'::regclass
  ) then
    alter table public.user_profil
    add constraint user_profil_role_app_check
    check (role_app in ('pasteur', 'admin', 'membre'));
  end if;
end $$;

create or replace function public.can_manage_predications()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profil
    where id = auth.uid()
      and role_app in ('pasteur', 'admin')
  );
$$;

drop policy if exists "predication_insert_authenticated" on public.predication;
drop policy if exists "predication_update_authenticated" on public.predication;
drop policy if exists "predication_delete_authenticated" on public.predication;
drop policy if exists "predication_insert_staff" on public.predication;
drop policy if exists "predication_update_staff" on public.predication;
drop policy if exists "predication_delete_staff" on public.predication;

create policy "predication_insert_staff"
on public.predication
for insert
to authenticated
with check (public.can_manage_predications());

create policy "predication_update_staff"
on public.predication
for update
to authenticated
using (public.can_manage_predications())
with check (public.can_manage_predications());

create policy "predication_delete_staff"
on public.predication
for delete
to authenticated
using (public.can_manage_predications());

drop policy if exists "predication_audio_insert_authenticated" on storage.objects;
drop policy if exists "predication_audio_update_authenticated" on storage.objects;
drop policy if exists "predication_audio_delete_authenticated" on storage.objects;
drop policy if exists "predication_audio_insert_staff" on storage.objects;
drop policy if exists "predication_audio_update_staff" on storage.objects;
drop policy if exists "predication_audio_delete_staff" on storage.objects;

create policy "predication_audio_insert_staff"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'predications-audio'
  and public.can_manage_predications()
);

create policy "predication_audio_update_staff"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'predications-audio'
  and public.can_manage_predications()
)
with check (
  bucket_id = 'predications-audio'
  and public.can_manage_predications()
);

create policy "predication_audio_delete_staff"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'predications-audio'
  and public.can_manage_predications()
);
