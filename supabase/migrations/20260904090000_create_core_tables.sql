create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_profil (
  id uuid not null default auth.uid(),
  username character varying unique,
  nom character varying,
  prenom character varying,
  bio text,
  date_naissance date,
  created_at timestamptz not null default now(),
  is_admin boolean,
  role_app text not null default 'membre'::text,
  image_url text,
  constraint user_profil_pkey primary key (id),
  constraint user_profil_role_app_check
    check (role_app = any (array['pasteur'::text, 'admin'::text, 'membre'::text]))
);

create table if not exists public.categorie_predication (
  categorie_id uuid not null default gen_random_uuid(),
  name character varying not null,
  constraint categorie_predication_pkey primary key (categorie_id)
);

create table if not exists public.predication (
  predication_id uuid not null default gen_random_uuid(),
  categorie_id uuid,
  title character varying not null,
  media_url text not null,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  constraint predication_pkey primary key (predication_id),
  constraint predication_categorie_fkey
    foreign key (categorie_id)
    references public.categorie_predication(categorie_id)
);

create table if not exists public.predication_favorites (
  user_id uuid not null,
  predication_id uuid not null,
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid(),
  constraint predication_favorites_pkey primary key (id),
  constraint favori_predication_id_fkey
    foreign key (predication_id)
    references public.predication(predication_id),
  constraint predication_favorites_user_id_fkey
    foreign key (user_id)
    references public.user_profil(id)
);

create table if not exists public.predication_likes (
  user_id uuid not null,
  predication_id uuid not null,
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid(),
  constraint predication_likes_pkey primary key (id),
  constraint like_predication_id_fkey
    foreign key (predication_id)
    references public.predication(predication_id),
  constraint predication_likes_user_id_fkey
    foreign key (user_id)
    references public.user_profil(id)
);

create table if not exists public.groupe (
  groupe_id uuid not null default gen_random_uuid(),
  name character varying not null,
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint groupe_pkey primary key (groupe_id),
  constraint groupe_created_by_fkey
    foreign key (created_by)
    references public.user_profil(id)
);

create table if not exists public.groupe_membre (
  gmembre_id uuid not null default gen_random_uuid(),
  groupe_id uuid not null,
  user_id uuid not null,
  is_group_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  constraint groupe_membre_pkey primary key (gmembre_id),
  constraint groupe_membre_groupe_id_fkey
    foreign key (groupe_id)
    references public.groupe(groupe_id),
  constraint groupe_membre_user_id_fkey
    foreign key (user_id)
    references public.user_profil(id)
);

create table if not exists public.annonce (
  annonce_id uuid not null default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  image_url text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint annonce_pkey primary key (annonce_id),
  constraint annonce_created_by_fkey
    foreign key (created_by)
    references public.user_profil(id)
);

create table if not exists public.message_groupe (
  message_id uuid not null default gen_random_uuid(),
  groupe_id uuid not null,
  user_id uuid not null,
  contenu text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint message_groupe_pkey primary key (message_id),
  constraint message_groupe_groupe_id_fkey
    foreign key (groupe_id)
    references public.groupe(groupe_id),
  constraint message_groupe_user_id_fkey
    foreign key (user_id)
    references public.user_profil(id)
);

create table if not exists public.notification (
  notification_id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  titre text not null,
  contenu text not null,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notification_pkey primary key (notification_id),
  constraint notification_type_check
    check (type = any (array['annonce'::text, 'message_groupe'::text, 'groupe_invitation'::text])),
  constraint notification_user_id_fkey
    foreign key (user_id)
    references public.user_profil(id)
);
