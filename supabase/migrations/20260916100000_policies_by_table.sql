begin;

alter table public.user_profil enable row level security;

drop policy if exists "user_profil_select_authenticated" on public.user_profil;
drop policy if exists "user_profil_insert_own" on public.user_profil;
drop policy if exists "user_profil_update_own" on public.user_profil;
drop policy if exists "user_profil_delete_own" on public.user_profil;

create policy "user_profil_select_authenticated"
on public.user_profil
for select
to authenticated
using (id = auth.uid() or (public.has_approved_app_access() and (statut_acces = 'accepte' or public.is_app_admin())));

create policy "user_profil_insert_own"
on public.user_profil
for insert
to authenticated
with check (id = auth.uid() and statut_acces = 'en_attente');

create policy "user_profil_update_own"
on public.user_profil
for update
to authenticated
using (id = auth.uid() and public.has_approved_app_access())
with check (id = auth.uid() and public.has_approved_app_access());

create policy "user_profil_delete_own"
on public.user_profil
for delete
to authenticated
using (id = auth.uid() and public.has_approved_app_access());

alter table public.categorie_predication enable row level security;

drop policy if exists "categorie_predication_select_authenticated" on public.categorie_predication;
drop policy if exists "categorie_predication_insert_authenticated" on public.categorie_predication;
drop policy if exists "categorie_predication_update_admin" on public.categorie_predication;
drop policy if exists "categorie_predication_delete_admin" on public.categorie_predication;

create policy "categorie_predication_select_authenticated"
on public.categorie_predication
for select
to authenticated
using (true);

create policy "categorie_predication_insert_authenticated"
on public.categorie_predication
for insert
to authenticated
with check (true);

create policy "categorie_predication_update_admin"
on public.categorie_predication
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "categorie_predication_delete_admin"
on public.categorie_predication
for delete
to authenticated
using (public.is_app_admin());

alter table public.predication enable row level security;

drop policy if exists "predication_select_authenticated" on public.predication;
drop policy if exists "predication_insert_authenticated" on public.predication;
drop policy if exists "predication_update_authenticated" on public.predication;
drop policy if exists "predication_delete_authenticated" on public.predication;
drop policy if exists "predication_insert_staff" on public.predication;
drop policy if exists "predication_update_staff" on public.predication;
drop policy if exists "predication_delete_staff" on public.predication;

create policy "predication_select_authenticated"
on public.predication
for select
to authenticated
using (true);

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

alter table public.predication_likes enable row level security;

drop policy if exists "predication_likes_select_authenticated" on public.predication_likes;
drop policy if exists "predication_likes_insert_own" on public.predication_likes;
drop policy if exists "predication_likes_delete_own" on public.predication_likes;

create policy "predication_likes_select_authenticated"
on public.predication_likes
for select
to authenticated
using (true);

create policy "predication_likes_insert_own"
on public.predication_likes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "predication_likes_delete_own"
on public.predication_likes
for delete
to authenticated
using (user_id = auth.uid());

alter table public.predication_favorites enable row level security;

drop policy if exists "predication_favorites_select_own" on public.predication_favorites;
drop policy if exists "predication_favorites_insert_own" on public.predication_favorites;
drop policy if exists "predication_favorites_delete_own" on public.predication_favorites;

create policy "predication_favorites_select_own"
on public.predication_favorites
for select
to authenticated
using (user_id = auth.uid());

create policy "predication_favorites_insert_own"
on public.predication_favorites
for insert
to authenticated
with check (user_id = auth.uid());

create policy "predication_favorites_delete_own"
on public.predication_favorites
for delete
to authenticated
using (user_id = auth.uid());

alter table public.groupe enable row level security;

drop policy if exists "groupe_select_members_only" on public.groupe;
drop policy if exists "groupe_insert_authenticated_creator" on public.groupe;
drop policy if exists "groupe_update_admin_only" on public.groupe;
drop policy if exists "groupe_update_manager" on public.groupe;
drop policy if exists "groupe_delete_admin_only" on public.groupe;
drop policy if exists "groupe_delete_creator_only" on public.groupe;

create policy "groupe_select_members_only"
on public.groupe
for select
to authenticated
using (
  public.is_group_member(groupe_id)
  or created_by = auth.uid()
);

create policy "groupe_insert_authenticated_creator"
on public.groupe
for insert
to authenticated
with check (created_by = auth.uid());

create policy "groupe_update_manager"
on public.groupe
for update
to authenticated
using (public.can_manage_group(groupe_id))
with check (public.can_manage_group(groupe_id));

drop policy if exists groupe_delete_admin_only on public.groupe;
drop policy if exists groupe_delete_creator_only on public.groupe;
drop policy if exists groupe_delete_creator_or_pastor on public.groupe;
create policy groupe_delete_creator_or_pastor
on public.groupe
for delete
to authenticated
using (public.can_delete_group(groupe_id));

alter table public.groupe_membre enable row level security;

drop policy if exists "groupe_membre_select_group_members_only" on public.groupe_membre;
drop policy if exists "groupe_membre_insert_admin_or_creator" on public.groupe_membre;
drop policy if exists "groupe_membre_update_admin_only" on public.groupe_membre;
drop policy if exists "groupe_membre_delete_admin_or_self" on public.groupe_membre;
drop policy if exists "groupe_membre_insert_manager" on public.groupe_membre;
drop policy if exists "groupe_membre_update_manager" on public.groupe_membre;
drop policy if exists "groupe_membre_delete_manager_or_self" on public.groupe_membre;

create policy "groupe_membre_select_group_members_only"
on public.groupe_membre
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_member(groupe_id)
);

create policy "groupe_membre_insert_manager"
on public.groupe_membre
for insert
to authenticated
with check (
  public.can_manage_group(groupe_id)
  or (
    user_id = auth.uid()
    and is_group_admin = true
    and public.is_group_creator(groupe_id)
  )
);

create policy "groupe_membre_update_manager"
on public.groupe_membre
for update
to authenticated
using (public.can_manage_group(groupe_id))
with check (public.can_manage_group(groupe_id));

create policy "groupe_membre_delete_manager_or_self"
on public.groupe_membre
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.can_manage_group(groupe_id)
);

alter table public.annonce enable row level security;

drop policy if exists "annonce_select_authenticated" on public.annonce;
drop policy if exists "annonce_insert_staff" on public.annonce;
drop policy if exists "annonce_update_staff" on public.annonce;
drop policy if exists "annonce_delete_staff" on public.annonce;

create policy "annonce_select_authenticated"
on public.annonce
for select
to authenticated
using (true);

create policy "annonce_insert_staff"
on public.annonce
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_annonces()
);

create policy "annonce_update_staff"
on public.annonce
for update
to authenticated
using (public.can_manage_annonces())
with check (public.can_manage_annonces());

create policy "annonce_delete_staff"
on public.annonce
for delete
to authenticated
using (public.can_manage_annonces());

alter table public.message_groupe enable row level security;

drop policy if exists "message_groupe_select_members" on public.message_groupe;
drop policy if exists "message_groupe_insert_members" on public.message_groupe;
drop policy if exists "message_groupe_insert_managers" on public.message_groupe;
drop policy if exists "message_groupe_update_own" on public.message_groupe;
drop policy if exists "message_groupe_delete_own_or_manager" on public.message_groupe;

create policy "message_groupe_select_members"
on public.message_groupe
for select
to authenticated
using (public.is_group_member(groupe_id));

create policy "message_groupe_insert_managers"
on public.message_groupe
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_group(groupe_id)
);

create policy "message_groupe_update_own"
on public.message_groupe
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "message_groupe_delete_own_or_manager"
on public.message_groupe
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.can_manage_group(groupe_id)
);

alter table public.notification enable row level security;

drop policy if exists "notification_select_own" on public.notification;
drop policy if exists "notification_update_own" on public.notification;
drop policy if exists "notification_delete_own" on public.notification;

create policy "notification_select_own"
on public.notification
for select
to authenticated
using (user_id = auth.uid());

create policy "notification_update_own"
on public.notification
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notification_delete_own"
on public.notification
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "church_images_select_authenticated" on storage.objects;
drop policy if exists "church_images_profile_insert_own" on storage.objects;
drop policy if exists "church_images_profile_update_own" on storage.objects;
drop policy if exists "church_images_profile_delete_own" on storage.objects;
drop policy if exists "church_images_predication_insert_staff" on storage.objects;
drop policy if exists "church_images_predication_update_staff" on storage.objects;
drop policy if exists "church_images_predication_delete_staff" on storage.objects;
drop policy if exists "predication_audio_select_authenticated" on storage.objects;
drop policy if exists "predication_audio_insert_authenticated" on storage.objects;
drop policy if exists "predication_audio_update_authenticated" on storage.objects;
drop policy if exists "predication_audio_delete_authenticated" on storage.objects;
drop policy if exists "predication_audio_insert_staff" on storage.objects;
drop policy if exists "predication_audio_update_staff" on storage.objects;
drop policy if exists "predication_audio_delete_staff" on storage.objects;

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

create policy "predication_audio_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'predications-audio');

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

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'user_profil', 'categorie_predication', 'predication',
    'predication_favorites', 'predication_likes', 'groupe',
    'groupe_membre', 'annonce', 'message_groupe', 'notification'
  ] loop
    execute format('drop policy if exists require_active_account_session on public.%I', target_table);
    execute format(
      'create policy require_active_account_session on public.%I as restrictive for all to authenticated using ((select public.is_active_account_session())) with check ((select public.is_active_account_session()))',
      target_table
    );
  end loop;
end;
$$;

drop policy if exists require_active_account_session on storage.objects;
create policy require_active_account_session on storage.objects
as restrictive for all to authenticated
using ((select public.is_active_account_session()))
with check ((select public.is_active_account_session()));

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'categorie_predication', 'predication', 'predication_favorites', 'predication_likes',
    'groupe', 'groupe_membre', 'annonce', 'message_groupe', 'notification'
  ] loop
    execute format('drop policy if exists require_approved_app_access on public.%I', target_table);
    execute format(
      'create policy require_approved_app_access on public.%I as restrictive for all to authenticated using ((select public.has_approved_app_access())) with check ((select public.has_approved_app_access()))',
      target_table
    );
  end loop;
end;
$$;

drop policy if exists require_approved_app_access on storage.objects;
create policy require_approved_app_access on storage.objects
as restrictive for all to authenticated
using ((select public.has_approved_app_access()))
with check ((select public.has_approved_app_access()));

commit;
