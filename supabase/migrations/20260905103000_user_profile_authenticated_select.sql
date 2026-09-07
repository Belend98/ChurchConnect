alter table public.user_profil enable row level security;

drop policy if exists "user_profil_select_authenticated" on public.user_profil;

create policy "user_profil_select_authenticated"
on public.user_profil
for select
to authenticated
using (true);
