create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profil
    where id = auth.uid()
      and is_admin = true
  );
$$;

drop policy if exists "categorie_predication_update_admin" on public.categorie_predication;
drop policy if exists "categorie_predication_delete_admin" on public.categorie_predication;

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
