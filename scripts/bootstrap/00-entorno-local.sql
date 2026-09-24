create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists net;
create schema if not exists cron;
create schema if not exists graphql_public;

do $$ begin create role anon;           exception when duplicate_object then null; end $$;
do $$ begin create role authenticated;  exception when duplicate_object then null; end $$;
do $$ begin create role service_role;   exception when duplicate_object then null; end $$;
do $$ begin create role supabase_admin; exception when duplicate_object then null; end $$;
do $$ begin create role postgres;       exception when duplicate_object then null; end $$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text, encrypted_password text, raw_user_meta_data jsonb,
  raw_app_meta_data jsonb, created_at timestamptz default now(),
  updated_at timestamptz default now(), email_confirmed_at timestamptz,
  last_sign_in_at timestamptz, phone text, confirmed_at timestamptz
);
create or replace function auth.uid()  returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select 'anon'::text $$;
create or replace function auth.email() returns text language sql stable as $$ select null::text $$;
create or replace function auth.jwt()  returns jsonb language sql stable as $$ select '{}'::jsonb $$;

create table if not exists storage.buckets (
  id text primary key, name text not null, owner uuid, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, path_tokens text[],
  created_at timestamptz default now(), updated_at timestamptz default now(),
  last_accessed_at timestamptz default now()
);
create or replace function storage.foldername(name text) returns text[] language sql stable as $$ select string_to_array(name,'/') $$;
create or replace function storage.filename(name text)   returns text   language sql stable as $$ select split_part(name,'/',-1) $$;
create or replace function storage.extension(name text)  returns text   language sql stable as $$ select split_part(name,'.',-1) $$;

-- pg_net / pg_cron: no existen en PGlite. Los sustituimos por funciones inertes
-- para que la migracion que las invoca no rompa el replay del resto.
create or replace function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000)
  returns bigint language sql as $$ select 0::bigint $$;
create or replace function net.http_get(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000)
  returns bigint language sql as $$ select 0::bigint $$;
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$ select 0::bigint $$;
create or replace function cron.unschedule(job_name text) returns boolean language sql as $$ select true $$;
create or replace function extensions.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
create or replace function public.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
create or replace function public.gen_random_bytes(n int) returns bytea language sql as $$ select decode(repeat('00', n), 'hex') $$;
