create table if not exists public.notification (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profil(id) on delete cascade,
  type text not null check (
    type in ('annonce', 'message_groupe', 'groupe_invitation')
  ),
  titre text not null,
  contenu text not null,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notification_user_created_at_idx
on public.notification (user_id, created_at desc);

create index if not exists notification_user_unread_idx
on public.notification (user_id, is_read)
where is_read = false;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notification'
  ) then
    alter publication supabase_realtime add table public.notification;
  end if;
end $$;

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

create or replace function public.create_notification_for_annonce()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification (
    user_id,
    type,
    titre,
    contenu,
    reference_id
  )
  select
    profile.id,
    'annonce',
    new.titre,
    left(new.contenu, 220),
    new.annonce_id
  from public.user_profil profile
  where new.created_by is null
    or profile.id <> new.created_by;

  return new;
end;
$$;

create or replace function public.create_notification_for_group_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  group_name text;
begin
  select name into group_name
  from public.groupe
  where groupe_id = new.groupe_id;

  if exists (
    select 1
    from public.groupe
    where groupe_id = new.groupe_id
      and created_by = new.user_id
  ) then
    return new;
  end if;

  insert into public.notification (
    user_id,
    type,
    titre,
    contenu,
    reference_id
  )
  select
    membre.user_id,
    'message_groupe',
    coalesce(group_name, 'Nouveau message'),
    left(new.contenu, 220),
    new.groupe_id
  from public.groupe_membre membre
  where membre.groupe_id = new.groupe_id
    and membre.user_id <> new.user_id;

  return new;
end;
$$;

create or replace function public.create_notification_for_group_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  group_name text;
begin
  select name into group_name
  from public.groupe
  where groupe_id = new.groupe_id;

  insert into public.notification (
    user_id,
    type,
    titre,
    contenu,
    reference_id
  )
  values (
    new.user_id,
    'groupe_invitation',
    'Nouveau groupe',
    'Vous avez ete ajoute au groupe ' || coalesce(group_name, 'groupe') || '.',
    new.groupe_id
  );

  return new;
end;
$$;

drop trigger if exists annonce_create_notification on public.annonce;
create trigger annonce_create_notification
after insert on public.annonce
for each row
execute function public.create_notification_for_annonce();

drop trigger if exists message_groupe_create_notification on public.message_groupe;
create trigger message_groupe_create_notification
after insert on public.message_groupe
for each row
execute function public.create_notification_for_group_message();

drop trigger if exists groupe_membre_create_notification on public.groupe_membre;
create trigger groupe_membre_create_notification
after insert on public.groupe_membre
for each row
execute function public.create_notification_for_group_member();
