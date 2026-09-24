import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, type AppPermission } from '@/hooks/account/usePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Permiso necesario. Con varios, basta con tener uno (salvo requireAll). */
  permission: AppPermission | AppPermission[];
  /** Exige todos los permisos de la lista en vez de al menos uno. */
  requireAll?: boolean;
  /** Qué pintar si falta el permiso. Por defecto, el aviso de acceso denegado. */
  fallback?: React.ReactNode;
}

const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold text-foreground mb-4">Acceso denegado</h1>
      <p className="text-muted-foreground mb-6">
        Tu cuenta no tiene permisos para ver esta sección.
      </p>
      <a href="/" className="text-moss hover:underline">
        Volver a la tienda
      </a>
    </div>
  </div>
);

/**
 * Candado por permiso.
 *
 * Sustituye al patrón anterior, en el que las 14 páginas del panel compartían un
 * único `isAdmin`. Aquí cada ruta declara lo que necesita, así que un moderador
 * puede entrar en moderación sin ver facturas ni pedidos.
 *
 * Ojo: esto es UX, no seguridad. Quien decide de verdad es RLS en Postgres. Este
 * guard evita enseñar pantallas que la base de datos va a rechazar igualmente.
 */
export const RoleGuard = ({
  children,
  permission,
  requireAll = false,
  fallback,
}: RoleGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { canAny, canAll, isLoading } = usePermissions();
  const location = useLocation();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-moss" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = requireAll ? canAll(required) : canAny(required);

  if (!allowed) {
    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
};

/**
 * Versión en línea para ocultar botones y acciones sueltas dentro de una página
 * a la que sí se tiene acceso. No renderiza nada si falta el permiso.
 */
export const Can = ({
  permission,
  children,
  fallback = null,
}: {
  permission: AppPermission | AppPermission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { canAny } = usePermissions();
  const required = Array.isArray(permission) ? permission : [permission];

  return <>{canAny(required) ? children : fallback}</>;
};

export default RoleGuard;
