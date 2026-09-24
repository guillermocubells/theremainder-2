import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type AppPermission = Database['public']['Enums']['app_permission'];
export type AppRole = Database['public']['Enums']['app_role'];

/**
 * Permisos y rol efectivo del usuario actual.
 *
 * Una sola llamada resuelve todos los candados de la sesión, en lugar de un
 * has_role() por componente. La caché evita que cada montaje del panel vuelva a
 * preguntar a la base de datos.
 *
 * Los permisos solo cambian cuando alguien reparte roles, así que aguantan de
 * sobra los 5 minutos de staleTime. Tras un cambio de roles se invalidan a mano
 * con useInvalidatePermissions().
 */
export const usePermissions = () => {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['my-permissions', user?.id],
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [permissionsResult, roleResult] = await Promise.all([
        supabase.rpc('my_permissions'),
        supabase.rpc('my_role'),
      ]);

      if (permissionsResult.error) throw permissionsResult.error;
      if (roleResult.error) throw roleResult.error;

      return {
        permissions: (permissionsResult.data ?? []) as AppPermission[],
        role: (roleResult.data ?? null) as AppRole | null,
      };
    },
  });

  const permissions = query.data?.permissions ?? [];

  const can = (permission: AppPermission) => permissions.includes(permission);
  const canAny = (required: AppPermission[]) => required.some(can);
  const canAll = (required: AppPermission[]) => required.every(can);

  return {
    permissions,
    role: query.data?.role ?? null,
    can,
    canAny,
    canAll,
    /** Cualquier permiso abre la puerta del panel; qué se ve dentro lo decide cada guard. */
    hasPanelAccess: permissions.length > 0,
    isLoading: authLoading || (!!user && query.isLoading),
    error: query.error,
  };
};

/** Refresca los permisos tras repartir roles, sin recargar la página. */
export const useInvalidatePermissions = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
};
