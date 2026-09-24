-- Sistema de permisos granulares.
--
-- Antes: un único candado binario. has_role(uid,'admin') abría las 14 páginas del
-- panel y todas las políticas RLS. 'moderator' existía en el enum pero ningún guard
-- del frontend lo usaba.
--
-- Ahora: los roles agrupan permisos, y el código pregunta por permiso, no por rol.
-- Añadir un rol nuevo deja de exigir tocar políticas RLS una por una.
--
-- Jerarquía: superadmin > admin > moderator > user.
-- has_role() pasa a respetarla, de forma que las ~126 migraciones existentes que
-- comprueban has_role(uid,'admin') siguen funcionando sin tocarlas, y un superadmin
-- puede hacer todo lo que puede un admin.

-- ---------------------------------------------------------------------------
-- 1. Catálogo de permisos
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_permission AS ENUM (
  'dashboard.view',
  'plants.view',      'plants.manage',
  'categories.view',  'categories.manage',
  'orders.view',      'orders.manage',
  'invoices.view',    'invoices.manage',
  'shipping.view',    'shipping.manage',
  'referrals.view',   'referrals.manage',
  'fraud.view',       'fraud.manage',
  'auctions.view',    'auctions.manage',
  'disputes.view',    'disputes.manage',
  'moderation.view',  'moderation.manage',
  'audit.view',
  'analytics.view',
  'settings.view',    'settings.manage',
  'roles.view',       'roles.manage'
);

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Jerarquía de roles
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.role_rank(_role public.app_role)
RETURNS INT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'superadmin' THEN 3
    WHEN 'admin'      THEN 2
    WHEN 'moderator'  THEN 1
    ELSE 0
  END
$$;

-- Reemplaza el cuerpo de has_role() manteniendo firma y tipo de retorno, así que
-- las políticas RLS que ya dependen de ella no se invalidan.
--
-- Los roles con rango (superadmin/admin/moderator) se comparan por jerarquía: un
-- admin satisface has_role(uid,'moderator'). Los roles sin rango ('user') se
-- comparan por igualdad exacta, para que has_role(uid,'user') no devuelva true
-- para cualquiera que tenga un rol superior.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.role_rank(_role) = 0 THEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND public.role_rank(ur.role) >= public.role_rank(_role)
    )
  END
$$;

-- ---------------------------------------------------------------------------
-- 3. Comprobación por permiso
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission public.app_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;

-- El frontend pide sus permisos de una sola vez en lugar de una llamada por candado.
CREATE OR REPLACE FUNCTION public.my_permissions()
RETURNS SETOF public.app_permission
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT rp.permission
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  WHERE ur.user_id = auth.uid()
$$;

-- Rol efectivo (el de mayor rango) del usuario actual. Para mostrarlo en la UI.
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY public.role_rank(ur.role) DESC
  LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- 4. Qué puede cada rol
-- ---------------------------------------------------------------------------

-- superadmin: todo, sin excepciones.
INSERT INTO public.role_permissions (role, permission)
SELECT 'superadmin'::public.app_role, unnest(enum_range(NULL::public.app_permission))
ON CONFLICT (role, permission) DO NOTHING;

-- admin: gestiona la tienda entera, pero NO reparte roles.
-- Esta es la separación que justifica el nivel nuevo: los admins llevan el negocio,
-- el superadmin decide quién es admin.
INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, p
FROM unnest(enum_range(NULL::public.app_permission)) AS p
WHERE p <> 'roles.manage'::public.app_permission
ON CONFLICT (role, permission) DO NOTHING;

-- moderator: contenido y reportes. Sin acceso a pedidos, facturas, dinero ni ajustes.
INSERT INTO public.role_permissions (role, permission)
VALUES
  ('moderator', 'dashboard.view'),
  ('moderator', 'moderation.view'),
  ('moderator', 'moderation.manage'),
  ('moderator', 'disputes.view'),
  ('moderator', 'fraud.view'),
  ('moderator', 'plants.view')
ON CONFLICT (role, permission) DO NOTHING;

-- 'user' no recibe ningún permiso de panel: es el cliente de la tienda.

-- ---------------------------------------------------------------------------
-- 5. RLS de role_permissions
-- ---------------------------------------------------------------------------

-- Lectura abierta a usuarios autenticados: el frontend necesita la matriz para
-- pintar la pantalla de roles. No es información sensible (es el reglamento, no
-- quién lo cumple).
CREATE POLICY "Authenticated can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only roles.manage can modify role permissions"
ON public.role_permissions
FOR ALL
USING (public.has_permission(auth.uid(), 'roles.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

-- ---------------------------------------------------------------------------
-- 6. Bootstrap: alguien tiene que ser superadmin
-- ---------------------------------------------------------------------------

-- Sin esto, 'roles.manage' quedaría fuera del alcance de todo el mundo y la
-- pantalla de roles nacería muerta. Se promociona el admin más antiguo (la cuenta
-- fundadora). No se hardcodea ningún email.
DO $$
DECLARE
  _founder UUID;
BEGIN
  SELECT user_id INTO _founder
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF _founder IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_founder, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. RLS de user_roles: repartir roles deja de ser cosa de cualquier admin
-- ---------------------------------------------------------------------------

-- La política anterior dejaba a cualquier admin gestionar todos los roles, lo que
-- permitía que un admin se auto-promocionase o degradase a otro admin.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'roles.view'));

CREATE POLICY "Only roles.manage can assign roles"
ON public.user_roles
FOR ALL
USING (public.has_permission(auth.uid(), 'roles.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

-- ---------------------------------------------------------------------------
-- 8. Candados que RLS no puede expresar
-- ---------------------------------------------------------------------------

-- Dos invariantes:
--   a) nadie toca sus propios roles, ni siquiera un superadmin (evita la escalada
--      silenciosa y obliga a que la promoción sea siempre un acto de otra persona);
--   b) no se puede quedar el sistema sin superadmin.
-- auth.uid() es NULL cuando se ejecuta desde el SQL editor o con service_role, así
-- que la recuperación manual sigue siendo posible si algo se atasca.
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target UUID := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  IF auth.uid() IS NOT NULL AND _target = auth.uid() THEN
    RAISE EXCEPTION 'No puedes modificar tus propios roles';
  END IF;

  IF TG_OP IN ('DELETE', 'UPDATE') AND OLD.role = 'superadmin' THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'superadmin') <= 1 THEN
      RAISE EXCEPTION 'No puedes eliminar el ultimo superadmin';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER guard_user_roles_changes
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_roles();

-- ---------------------------------------------------------------------------
-- 9. Auditoría de cambios de rol
-- ---------------------------------------------------------------------------

-- Se engancha a audit_logs, que ya existe y encadena checksums.
CREATE OR REPLACE FUNCTION public.audit_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_role TEXT;
  _action TEXT;
BEGIN
  _actor_role := COALESCE(
    (SELECT ur.role::text
     FROM public.user_roles ur
     WHERE ur.user_id = auth.uid()
     ORDER BY public.role_rank(ur.role) DESC
     LIMIT 1),
    'system'
  );

  _action := CASE TG_OP
    WHEN 'INSERT' THEN 'role.granted'
    WHEN 'DELETE' THEN 'role.revoked'
    ELSE 'role.updated'
  END;

  INSERT INTO public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, old_data, new_data
  )
  VALUES (
    auth.uid(),
    _actor_role,
    _action,
    'user_roles',
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_role_change();

-- ---------------------------------------------------------------------------
-- 10. Lectura del directorio de roles
-- ---------------------------------------------------------------------------

-- profiles solo deja ver el perfil propio (is_own_profile), así que un join desde
-- el panel devolvería filas vacías. Estas dos funciones son la única rendija, y
-- están acotadas a propósito:
--   - list_role_assignments() solo devuelve gente que YA tiene un rol, nunca la
--     base de clientes entera;
--   - find_user_by_email() exige email exacto, así que no sirve para enumerar.

CREATE OR REPLACE FUNCTION public.list_role_assignments()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role public.app_role,
  granted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_permission(auth.uid(), 'roles.view') THEN
    RAISE EXCEPTION 'No tienes permiso para ver los roles asignados';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, p.email, p.full_name, ur.role, ur.created_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  ORDER BY public.role_rank(ur.role) DESC, p.email ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_user_by_email(_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_permission(auth.uid(), 'roles.manage') THEN
    RAISE EXCEPTION 'No tienes permiso para asignar roles';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name
  FROM public.profiles p
  WHERE lower(p.email) = lower(trim(_email))
  LIMIT 1;
END;
$$;
