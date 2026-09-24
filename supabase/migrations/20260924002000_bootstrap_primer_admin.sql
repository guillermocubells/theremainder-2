-- Arranque del primer administrador sobre una base sin administradores.
--
-- La migracion 20260828120100 promociona a superadmin "el admin mas antiguo"
-- que encuentre en user_roles. Sobre una base recien creada esa tabla esta
-- vacia: no encuentra a nadie, y nadie queda con 'roles.manage'. La propia
-- migracion lo advierte -- "la pantalla de roles naceria muerta" -- y eso es
-- exactamente lo que pasa en un reset limpio.
--
-- Esto rompe el huevo-gallina sin hardcodear ningun correo: promociona al
-- usuario mas antiguo, que en una instalacion nueva es siempre el dueno.
--
-- Idempotente y sin efecto sobre una base que ya tiene superadmin: si existe
-- uno, sale sin tocar nada. Tampoco falla si aun no hay usuarios.
--
-- Nota sobre el trigger guard_user_roles: prohibe que nadie modifique sus
-- propios roles, pero solo cuando auth.uid() NO es NULL. Una migracion corre
-- sin sesion, asi que la guarda no se dispara. Es la via prevista.

DO $$
DECLARE
  _uid   UUID;
  _email TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'superadmin') THEN
    RAISE NOTICE 'Ya hay superadmin: no se toca nada.';
    RETURN;
  END IF;

  SELECT id, email INTO _uid, _email
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF _uid IS NULL THEN
    RAISE NOTICE 'Todavia no hay usuarios. Crea uno y vuelve a aplicar esta migracion.';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Promocionado a admin y superadmin: % (%)', _email, _uid;
END $$;
