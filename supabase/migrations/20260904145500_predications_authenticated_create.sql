insert into storage.buckets (id, name, public)
values ('predications-audio', 'predications-audio', true)
on conflict (id) do update
set public = true;

alter table public.predication enable row level security;

drop policy if exists "predication_select_authenticated" on public.predication;
drop policy if exists "predication_insert_authenticated" on public.predication;
drop policy if exists "predication_update_authenticated" on public.predication;
drop policy if exists "predication_delete_authenticated" on public.predication;

create policy "predication_select_authenticated"
on public.predication
for select
to authenticated
using (true);

create policy "predication_insert_authenticated"
on public.predication
for insert
to authenticated
with check (true);

create policy "predication_update_authenticated"
on public.predication
for update
to authenticated
using (true)
with check (true);

create policy "predication_delete_authenticated"
on public.predication
for delete
to authenticated
using (true);

drop policy if exists "predication_audio_select_authenticated" on storage.objects;
drop policy if exists "predication_audio_insert_authenticated" on storage.objects;
drop policy if exists "predication_audio_update_authenticated" on storage.objects;
drop policy if exists "predication_audio_delete_authenticated" on storage.objects;

create policy "predication_audio_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'predications-audio');

create policy "predication_audio_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'predications-audio');

create policy "predication_audio_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'predications-audio')
with check (bucket_id = 'predications-audio');

create policy "predication_audio_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'predications-audio');
