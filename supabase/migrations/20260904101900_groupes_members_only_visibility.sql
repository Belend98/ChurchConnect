alter table public.groupe enable row level security;
alter table public.groupe_membre enable row level security;

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

drop policy if exists "groupe_select_members_only" on public.groupe;
drop policy if exists "groupe_insert_authenticated_creator" on public.groupe;
drop policy if exists "groupe_update_admin_only" on public.groupe;
drop policy if exists "groupe_delete_admin_only" on public.groupe;

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

create policy "groupe_update_admin_only"
on public.groupe
for update
to authenticated
using (public.is_group_admin(groupe_id))
with check (public.is_group_admin(groupe_id));

create policy "groupe_delete_admin_only"
on public.groupe
for delete
to authenticated
using (public.is_group_admin(groupe_id));

drop policy if exists "groupe_membre_select_group_members_only" on public.groupe_membre;
drop policy if exists "groupe_membre_insert_admin_or_creator" on public.groupe_membre;
drop policy if exists "groupe_membre_update_admin_only" on public.groupe_membre;
drop policy if exists "groupe_membre_delete_admin_or_self" on public.groupe_membre;

create policy "groupe_membre_select_group_members_only"
on public.groupe_membre
for select
to authenticated
using (public.is_group_member(groupe_id));

create policy "groupe_membre_insert_admin_or_creator"
on public.groupe_membre
for insert
to authenticated
with check (
  public.is_group_admin(groupe_id)
  or (
    user_id = auth.uid()
    and is_group_admin = true
    and public.is_group_creator(groupe_id)
  )
);

create policy "groupe_membre_update_admin_only"
on public.groupe_membre
for update
to authenticated
using (public.is_group_admin(groupe_id))
with check (public.is_group_admin(groupe_id));

create policy "groupe_membre_delete_admin_or_self"
on public.groupe_membre
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_admin(groupe_id)
);
