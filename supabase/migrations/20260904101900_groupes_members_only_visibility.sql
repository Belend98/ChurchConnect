alter table public.groupes enable row level security;
alter table public.groupe_members enable row level security;

create or replace function public.is_group_member(target_groupe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groupe_members
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
    from public.groupe_members
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
    from public.groupes
    where id = target_groupe_id
      and created_by = auth.uid()
  );
$$;

drop policy if exists "groupes_select_members_only" on public.groupes;
drop policy if exists "groupes_insert_authenticated_creator" on public.groupes;
drop policy if exists "groupes_update_admin_only" on public.groupes;
drop policy if exists "groupes_delete_admin_only" on public.groupes;

create policy "groupes_select_members_only"
on public.groupes
for select
to authenticated
using (public.is_group_member(id));

create policy "groupes_insert_authenticated_creator"
on public.groupes
for insert
to authenticated
with check (created_by = auth.uid());

create policy "groupes_update_admin_only"
on public.groupes
for update
to authenticated
using (public.is_group_admin(id))
with check (public.is_group_admin(id));

create policy "groupes_delete_admin_only"
on public.groupes
for delete
to authenticated
using (public.is_group_admin(id));

drop policy if exists "groupe_members_select_group_members_only" on public.groupe_members;
drop policy if exists "groupe_members_insert_admin_or_creator" on public.groupe_members;
drop policy if exists "groupe_members_update_admin_only" on public.groupe_members;
drop policy if exists "groupe_members_delete_admin_or_self" on public.groupe_members;

create policy "groupe_members_select_group_members_only"
on public.groupe_members
for select
to authenticated
using (public.is_group_member(groupe_id));

create policy "groupe_members_insert_admin_or_creator"
on public.groupe_members
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

create policy "groupe_members_update_admin_only"
on public.groupe_members
for update
to authenticated
using (public.is_group_admin(groupe_id))
with check (public.is_group_admin(groupe_id));

create policy "groupe_members_delete_admin_or_self"
on public.groupe_members
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_admin(groupe_id)
);
