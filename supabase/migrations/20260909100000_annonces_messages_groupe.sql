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

create table if not exists public.annonce (
  annonce_id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  image_url text,
  created_by uuid references public.user_profil(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.message_groupe (
  message_id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references public.groupe(groupe_id) on delete cascade,
  user_id uuid not null references public.user_profil(id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.annonce
drop constraint if exists annonce_created_by_fkey;

alter table public.annonce
add constraint annonce_created_by_fkey
foreign key (created_by)
references public.user_profil(id)
on delete set null;

alter table public.message_groupe
drop constraint if exists message_groupe_user_id_fkey;

alter table public.message_groupe
add constraint message_groupe_user_id_fkey
foreign key (user_id)
references public.user_profil(id)
on delete cascade;

create index if not exists annonce_created_at_idx
on public.annonce (created_at desc);

create index if not exists message_groupe_groupe_created_at_idx
on public.message_groupe (groupe_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_groupe'
  ) then
    alter publication supabase_realtime add table public.message_groupe;
  end if;
end $$;

alter table public.annonce enable row level security;
alter table public.message_groupe enable row level security;

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
