do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.annonce'::regclass
      and contype in ('p', 'u')
      and conkey = array[
        (
          select attnum
          from pg_attribute
          where attrelid = 'public.annonce'::regclass
            and attname = 'created_by'
        )
      ]::smallint[]
  loop
    execute format(
      'alter table public.annonce drop constraint %I',
      constraint_record.conname
    );
  end loop;
end $$;

do $$
declare
  index_record record;
begin
  for index_record in
    select indexrelid::regclass as index_name
    from pg_index
    where indrelid = 'public.annonce'::regclass
      and indisunique = true
      and indisprimary = false
      and indnatts = 1
      and indkey[0] = (
        (
          select attnum
          from pg_attribute
          where attrelid = 'public.annonce'::regclass
            and attname = 'created_by'
        )
      )
  loop
    execute format('drop index if exists %s', index_record.index_name);
  end loop;
end $$;

alter table public.annonce
alter column annonce_id set default gen_random_uuid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.annonce'::regclass
      and contype = 'p'
  ) then
    alter table public.annonce
    add constraint annonce_pkey primary key (annonce_id);
  end if;
end $$;
