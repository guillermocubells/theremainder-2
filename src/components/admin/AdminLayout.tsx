import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/account/usePermissions";
import { AdminSidebar } from "./AdminSidebar";
import { Loader2 } from "lucide-react";

export function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { hasPanelAccess, isLoading: permissionsLoading } = usePermissions();

  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-moss" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // La puerta del panel la abre cualquier permiso, no el rol de admin: un
  // moderador entra y ve solo su sección. Cada ruta declara lo suyo con RoleGuard.
  if (!hasPanelAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Acceso Denegado
          </h1>
          <p className="text-muted-foreground mb-6">
            No tienes permisos para acceder al panel de administración.
          </p>
          <a href="/" className="text-moss hover:underline">
            Volver a la tienda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
