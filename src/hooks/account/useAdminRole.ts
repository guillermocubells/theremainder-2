import { usePermissions } from './usePermissions';

/**
 * Compatibilidad con el candado binario anterior.
 *
 * Antes hacía su propia llamada a has_role() con useState/useEffect, sin caché ni
 * invalidación, revalidando en cada montaje. Ahora se deriva de usePermissions,
 * que resuelve todos los permisos de la sesión en una sola query cacheada.
 *
 * Los guards nuevos deberían pedir el permiso concreto (usePermissions().can(...)
 * o <RoleGuard permission="...">) en vez de preguntar "¿es admin?". Este hook se
 * mantiene porque hay cuatro pantallas que aún lo usan.
 */
export function useAdminRole() {
  const { role, isLoading } = usePermissions();

  return {
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin',
    isLoading,
  };
}
