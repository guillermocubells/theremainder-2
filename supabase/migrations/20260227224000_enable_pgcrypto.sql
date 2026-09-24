-- pgcrypto: la migracion siguiente (20260227224130, collection_shares) usa
-- gen_random_bytes(16) para generar el token de comparticion, pero ninguna
-- migracion anterior habilitaba la extension. En el proyecto original se
-- activo a mano desde el panel, asi que el repositorio NO podia reconstruir
-- la base de datos desde cero. Esto lo arregla.
--
-- Supabase instala las extensiones en el esquema `extensions`, que no esta en
-- el search_path de la sesion que aplica migraciones. Por eso, ademas de
-- crearla, se publica un puente en `public` con el nombre sin cualificar que
-- espera la migracion.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.gen_random_bytes(integer)
returns bytea
language sql
volatile
parallel safe
as $$ select extensions.gen_random_bytes($1) $$;
