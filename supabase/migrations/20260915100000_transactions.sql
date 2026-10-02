begin;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_profil
    where id = auth.uid() and role_app in ('pasteur', 'admin')
  );
$$;
create or replace function public.protect_user_profil_roles()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role_app is distinct from 'membre'
       or coalesce(new.is_admin, false) then
      raise exception 'Un nouveau profil doit avoir le rôle membre.'
        using errcode = '42501';
    end if;
  else
    if new.id is distinct from old.id then
      raise exception 'L’identifiant du profil ne peut pas être modifié.'
        using errcode = '42501';
    end if;
    if new.role_app is distinct from old.role_app
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Utilisez la fonction change_user_role pour modifier les droits.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_profil_roles on public.user_profil;
create trigger protect_user_profil_roles
before insert or update on public.user_profil
for each row execute function public.protect_user_profil_roles();
create or replace function public.change_user_role(
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_role text;
begin
  if actor_id is null then
    raise exception 'Utilisateur non connecté.' using errcode = '42501';
  end if;

  if not public.is_active_account_session() then
    raise exception 'Session révoquée ou compte désactivé.' using errcode = '42501';
  end if;

  if new_role is null or new_role not in ('membre', 'admin') then
    raise exception 'Le rôle cible doit être membre ou admin.'
      using errcode = '22023';
  end if;
  select role_app into actor_role
  from public.user_profil where id = actor_id
  for update;

  if actor_role is null or actor_role not in ('pasteur', 'admin') then
    raise exception 'Seuls les pasteurs et les admins peuvent modifier les rôles.'
      using errcode = '42501';
  end if;

  select role_app into target_role
  from public.user_profil where id = target_user_id
  for update;

  if not found then
    raise exception 'Profil cible introuvable.' using errcode = 'P0002';
  end if;

  if target_role not in ('membre', 'admin') then
    raise exception 'Le rôle d’un pasteur ne peut pas être modifié ici.'
      using errcode = '42501';
  end if;

  update public.user_profil
  set role_app = new_role, is_admin = (new_role = 'admin')
  where id = target_user_id;
end;
$$;
alter function public.change_user_role(uuid, text) owner to postgres;
revoke all on function public.change_user_role(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.change_user_role(uuid, text) to authenticated;

revoke all on function public.protect_user_profil_roles()
  from public, anon, authenticated;

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

create or replace function public.can_manage_annonces()
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

create or replace function public.is_group_member(target_groupe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groupe_membre
    where groupe_id = target_groupe_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(target_groupe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groupe_membre
    where groupe_id = target_groupe_id
      and user_id = auth.uid()
      and is_group_admin = true
  );
$$;

create or replace function public.is_group_creator(target_groupe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groupe
    where groupe_id = target_groupe_id
      and created_by = auth.uid()
  );
$$;

create or replace function public.can_manage_group(target_groupe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    public.is_group_creator(target_groupe_id)
    or public.is_group_admin(target_groupe_id);
$$;

create or replace function public.detach_account_storage_ownership(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception 'Identifiant de compte requis.';
  end if;

  update storage.objects
  set owner = null, owner_id = null
  where owner_id = target_user_id::text or owner = target_user_id;

  update storage.buckets
  set owner = null, owner_id = null
  where owner_id = target_user_id::text or owner = target_user_id;
end;
$$;

revoke all on function public.detach_account_storage_ownership(uuid)
  from public, anon, authenticated;
grant execute on function public.detach_account_storage_ownership(uuid)
  to service_role;

create or replace function public.is_active_account_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions s
    join auth.users u on u.id = s.user_id
    where s.user_id = (select auth.uid())
      and s.id::text = (select auth.jwt() ->> 'session_id')
      and (u.banned_until is null or u.banned_until <= now())
  );
$$;

revoke all on function public.is_active_account_session() from public, anon;
grant execute on function public.is_active_account_session() to authenticated, service_role;

create or replace function public.revoke_account_sessions(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception 'Identifiant de compte requis.';
  end if;
  delete from auth.refresh_tokens where user_id = target_user_id::text;
  delete from auth.sessions where user_id = target_user_id;
end;
$$;

revoke all on function public.revoke_account_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_account_sessions(uuid) to service_role;

create or replace function public.can_delete_group(target_groupe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_account_session()
    and (
      public.is_group_creator(target_groupe_id)
      or (
        public.is_group_admin(target_groupe_id)
        and exists (
          select 1 from public.user_profil
          where id = (select auth.uid()) and role_app = 'pasteur'
        )
      )
    );
$$;

revoke all on function public.can_delete_group(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.can_delete_group(uuid)
  to authenticated, service_role;

commit;
