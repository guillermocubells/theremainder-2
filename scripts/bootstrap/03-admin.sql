-- =============================================================================
-- Paso 3: crear el primer administrador.
--
-- POR QUE HACE FALTA ESTE FICHERO
-- La migracion 20260828120100 promociona a superadmin al admin mas antiguo que
-- encuentre en public.user_roles. Sobre una base recien creada esa tabla esta
-- VACIA: ninguna migracion inserta en ella. Asi que _founder queda NULL, no se
-- crea ningun superadmin, y nadie tiene el permiso 'roles.manage'.
-- La propia migracion lo dice: sin eso "la pantalla de roles naceria muerta".
-- Eso es exactamente lo que pasa en un reset limpio.
--
-- COMO SE USA
--   1. Registrate primero en la tienda con el email que quieras usar de admin
--      (Auth -> Sign up, o el formulario de registro de la web). Este script NO
--      crea la cuenta: solo le da los roles a una cuenta que ya existe.
--   2. Panel de Supabase -> SQL Editor -> New query.
--   3. Cambia el email de la linea de abajo. Pega. Run.
--
-- POR QUE FUNCIONA DESDE EL SQL EDITOR Y NO DESDE LA APLICACION
-- El trigger guard_user_roles prohibe que nadie modifique sus propios roles,
-- incluido un superadmin. La condicion exacta es:
--     IF auth.uid() IS NOT NULL AND _target = auth.uid() THEN ... EXCEPTION
-- En el SQL Editor auth.uid() es NULL, asi que la guarda no se dispara. Esa es la
-- via de recuperacion prevista, y la unica que funciona sobre una base sin admin.
--
-- Idempotente: re-ejecutarlo no duplica ni falla.
-- =============================================================================

DO $$
DECLARE
  -- >>>>>>>>>>>>>>>> CAMBIA ESTE EMAIL <<<<<<<<<<<<<<<<
  _email TEXT := 'cambiame@ejemplo.com';
  _uid   UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(_email);

  IF _uid IS NULL THEN
    RAISE EXCEPTION
      'No existe ningun usuario con email %. Registrate primero en la tienda y vuelve a ejecutar esto.',
      _email;
  END IF;

  -- 'admin' primero: es el rol que mira el resto de la aplicacion.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 'superadmin' es el que concede 'roles.manage', o sea el que permite repartir
  -- roles a los demas desde la pantalla de administracion.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'OK: % es admin y superadmin (uid %)', _email, _uid;
END $$;

-- Comprobacion. Debe devolver dos filas: admin y superadmin.
SELECT u.email, r.role, r.created_at
FROM public.user_roles r
JOIN auth.users u ON u.id = r.user_id
ORDER BY r.created_at;
