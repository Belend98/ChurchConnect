begin;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_profil
    where id = auth.uid() and role_app in ('pasteur', 'admin') and statut_acces = 'accepte'
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
       or new.statut_acces is distinct from 'en_attente' then
      raise exception 'Un nouveau profil doit avoir le rôle membre et être en attente.'
        using errcode = '42501';
    end if;
  else
    if new.id is distinct from old.id then
      raise exception 'L’identifiant du profil ne peut pas être modifié.'
        using errcode = '42501';
    end if;
    if new.statut_acces is distinct from old.statut_acces then
      raise exception 'Utilisez la fonction de décision pour modifier le statut d’accès.'
        using errcode = '42501';
    end if;
    if new.role_app is distinct from old.role_app then
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
  from public.user_profil where id = actor_id and statut_acces = 'accepte'
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
  set role_app = new_role
  where id = target_user_id;
end;
$$;
alter function public.change_user_role(uuid, text) owner to postgres;
revoke all on function public.change_user_role(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.change_user_role(uuid, text) to authenticated;

revoke all on function public.protect_user_profil_roles()
  from public, anon, authenticated;

alter table public.user_profil drop column if exists is_admin;

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

create or replace function public.protect_group_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  creator_id uuid;
begin
  if tg_op = 'DELETE' then
    -- Sérialiser les départs et les ajouts au sein du même groupe.
    select created_by into creator_id from public.groupe
    where groupe_id = old.groupe_id for update;
    if not found then return old; end if;
    if old.user_id = (select auth.uid()) then
      return old;
    end if;
    select role_app into target_role from public.user_profil where id = old.user_id;
    if target_role = 'pasteur' then
      raise exception 'Le pasteur ne peut pas être retiré du groupe.' using errcode = '42501';
    end if;
    if target_role is not null and creator_id = old.user_id then
      raise exception 'Le créateur ne peut pas être retiré du groupe.' using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and (
    new.gmembre_id is distinct from old.gmembre_id
    or new.groupe_id is distinct from old.groupe_id
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'L’identité et le groupe d’un membre ne peuvent pas être modifiés.' using errcode = '42501';
  end if;
  select role_app into target_role from public.user_profil where id = new.user_id;
  select created_by into creator_id from public.groupe
  where groupe_id = new.groupe_id for update;
  if target_role = 'pasteur' or creator_id = new.user_id then
    if tg_op = 'UPDATE' and new.is_group_admin is distinct from true then
      raise exception 'Le pasteur et le créateur conservent les droits administrateur du groupe.' using errcode = '42501';
    end if;
    new.is_group_admin := true;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_group_membership() from public, anon, authenticated;
drop trigger if exists protect_group_membership on public.groupe_membre;
create trigger protect_group_membership
before insert or update or delete on public.groupe_membre
for each row execute function public.protect_group_membership();

create or replace function public.delete_empty_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.groupe g
  where g.groupe_id = old.groupe_id
    and (
      not exists (
        select 1 from public.groupe_membre m where m.groupe_id = g.groupe_id
      )
      or (
        (select count(*) from public.groupe_membre m where m.groupe_id = g.groupe_id) = 1
        and exists (
          select 1
          from public.groupe_membre m
          join public.user_profil p on p.id = m.user_id
          where m.groupe_id = g.groupe_id
            and p.role_app = 'pasteur'
            and m.user_id is distinct from g.created_by
        )
      )
    );
  return old;
end;
$$;

alter function public.delete_empty_group() owner to postgres;
revoke all on function public.delete_empty_group() from public, anon, authenticated, service_role;

drop trigger if exists delete_empty_group on public.groupe_membre;
create trigger delete_empty_group
after delete on public.groupe_membre
for each row execute function public.delete_empty_group();

create or replace function public.add_group_administrators()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.groupe_membre (groupe_id, user_id, is_group_admin)
  select new.groupe_id, p.id, true
  from public.user_profil p
  where (p.id = new.created_by or p.role_app = 'pasteur')
    and not exists (
      select 1 from public.groupe_membre m
      where m.groupe_id = new.groupe_id and m.user_id = p.id
    );
  return new;
end;
$$;

revoke all on function public.add_group_administrators() from public, anon, authenticated;
drop trigger if exists add_group_administrators on public.groupe;
create trigger add_group_administrators
after insert on public.groupe
for each row execute function public.add_group_administrators();

create or replace function public.sync_pastor_group_memberships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.role_app is not distinct from old.role_app then
    return new;
  end if;
  if new.role_app = 'pasteur' then
    update public.groupe_membre set is_group_admin = true
    where user_id = new.id and is_group_admin is distinct from true;
    insert into public.groupe_membre (groupe_id, user_id, is_group_admin)
    select g.groupe_id, new.id, true from public.groupe g
    where not exists (
      select 1 from public.groupe_membre m
      where m.groupe_id = g.groupe_id and m.user_id = new.id
    );
  end if;
  return new;
end;
$$;

revoke all on function public.sync_pastor_group_memberships() from public, anon, authenticated;
drop trigger if exists sync_pastor_group_memberships on public.user_profil;
create trigger sync_pastor_group_memberships
after insert or update of role_app on public.user_profil
for each row execute function public.sync_pastor_group_memberships();

update public.groupe_membre m set is_group_admin = true
from public.user_profil p, public.groupe g
where m.user_id = p.id and m.groupe_id = g.groupe_id
  and (p.role_app = 'pasteur' or g.created_by = p.id)
  and m.is_group_admin is distinct from true;

insert into public.groupe_membre (groupe_id, user_id, is_group_admin)
select g.groupe_id, p.id, true from public.groupe g
join public.user_profil p on p.role_app = 'pasteur' or p.id = g.created_by
where not exists (
  select 1 from public.groupe_membre m
  where m.groupe_id = g.groupe_id and m.user_id = p.id
);

create or replace function public.has_approved_app_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_account_session() and exists (
    select 1 from public.user_profil where id = auth.uid() and statut_acces = 'accepte'
  );
$$;
alter function public.has_approved_app_access() owner to postgres;
revoke all on function public.has_approved_app_access() from public, anon;
grant execute on function public.has_approved_app_access() to authenticated;

create or replace function public.decide_account_access(target_user_id uuid, accepted boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_approved_app_access() or not public.is_app_admin() then
    raise exception 'Seuls le pasteur et les administrateurs peuvent gérer les demandes.' using errcode = '42501';
  end if;
  if accepted is null then
    raise exception 'Décision invalide.' using errcode = '22023';
  end if;
  update public.user_profil
  set statut_acces = case when accepted then 'accepte' else 'refuse' end
  where id = target_user_id
    and (statut_acces = 'en_attente' or (accepted and statut_acces = 'refuse'));
  if not found then
    raise exception 'Cette demande ne peut plus être traitée.' using errcode = 'P0002';
  end if;
end;
$$;
alter function public.decide_account_access(uuid, boolean) owner to postgres;
revoke all on function public.decide_account_access(uuid, boolean) from public, anon, authenticated, service_role;
grant execute on function public.decide_account_access(uuid, boolean) to authenticated;

-- Chaque nouveau message notifie les autres membres du groupe dans la même transaction.
create or replace function public.notify_group_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification (user_id, type, titre, contenu, reference_id)
  select m.user_id, 'message_groupe', g.name, new.contenu, new.groupe_id
  from public.groupe_membre m
  join public.groupe g on g.groupe_id = m.groupe_id
  join public.user_profil p on p.id = m.user_id
  where m.groupe_id = new.groupe_id
    and m.user_id is distinct from new.user_id
    and p.statut_acces = 'accepte';
  return new;
end;
$$;
alter function public.notify_group_message() owner to postgres;
revoke all on function public.notify_group_message() from public, anon, authenticated, service_role;

drop trigger if exists notify_group_message on public.message_groupe;
create trigger notify_group_message
after insert on public.message_groupe
for each row execute function public.notify_group_message();

commit;
