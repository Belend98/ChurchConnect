alter table public.categorie_predication enable row level security;

drop policy if exists "categorie_predication_select_authenticated" on public.categorie_predication;
drop policy if exists "categorie_predication_insert_authenticated" on public.categorie_predication;

create policy "categorie_predication_select_authenticated"
on public.categorie_predication
for select
to authenticated
using (true);

create policy "categorie_predication_insert_authenticated"
on public.categorie_predication
for insert
to authenticated
with check (true);
