alter table public.user_profil enable row level security;

drop policy if exists "user_profil_insert_own" on public.user_profil;
drop policy if exists "user_profil_update_own" on public.user_profil;
drop policy if exists "user_profil_delete_own" on public.user_profil;

create policy "user_profil_insert_own"
on public.user_profil
for insert
to authenticated
with check (id = auth.uid());

create policy "user_profil_update_own"
on public.user_profil
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "user_profil_delete_own"
on public.user_profil
for delete
to authenticated
using (id = auth.uid());
