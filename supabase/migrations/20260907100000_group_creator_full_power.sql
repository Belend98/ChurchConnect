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

drop policy if exists "groupe_update_admin_only" on public.groupe;
drop policy if exists "groupe_update_manager" on public.groupe;

create policy "groupe_update_manager"
on public.groupe
for update
to authenticated
using (public.can_manage_group(groupe_id))
with check (public.can_manage_group(groupe_id));

drop policy if exists "groupe_membre_insert_admin_or_creator" on public.groupe_membre;
drop policy if exists "groupe_membre_update_admin_only" on public.groupe_membre;
drop policy if exists "groupe_membre_delete_admin_or_self" on public.groupe_membre;
drop policy if exists "groupe_membre_insert_manager" on public.groupe_membre;
drop policy if exists "groupe_membre_update_manager" on public.groupe_membre;
drop policy if exists "groupe_membre_delete_manager_or_self" on public.groupe_membre;

create policy "groupe_membre_insert_manager"
on public.groupe_membre
for insert
to authenticated
with check (public.can_manage_group(groupe_id));

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
