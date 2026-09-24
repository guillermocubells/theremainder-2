import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { usePermissions, type AppPermission } from "@/hooks/account/usePermissions";
import {
  LayoutDashboard,
  Leaf,
  FolderTree,
  Truck,
  Settings,
  ArrowLeft,
  Package,
  FileText,
  Users,
  Shield,
  Gavel,
  MessageSquare,
  ScrollText,
  Eye,
  BarChart3,
  KeyRound,
} from "lucide-react";

// El permiso viaja con el ítem: la navegación y el guard de la ruta leen la misma
// declaración, así que no pueden desincronizarse.
const navItems: Array<{
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  permission: AppPermission;
}> = [
  { path: "/admin", icon: LayoutDashboard, label: "admin.dashboard", permission: "dashboard.view" },
  { path: "/admin/plants", icon: Leaf, label: "admin.plants", permission: "plants.view" },
  { path: "/admin/categories", icon: FolderTree, label: "admin.categories", permission: "categories.view" },
  { path: "/admin/orders", icon: Package, label: "admin.orders", permission: "orders.view" },
  { path: "/admin/invoices", icon: FileText, label: "admin.invoices", permission: "invoices.view" },
  { path: "/admin/shipping", icon: Truck, label: "admin.shipping", permission: "shipping.view" },
  { path: "/admin/referrals", icon: Users, label: "admin.referrals", permission: "referrals.view" },
  { path: "/admin/fraud", icon: Shield, label: "admin.fraud", permission: "fraud.view" },
  { path: "/admin/auctions", icon: Gavel, label: "admin.auctions", permission: "auctions.view" },
  { path: "/admin/disputes", icon: MessageSquare, label: "admin.disputes", permission: "disputes.view" },
  { path: "/admin/moderation", icon: Eye, label: "admin.moderation", permission: "moderation.view" },
  { path: "/admin/audit", icon: ScrollText, label: "admin.audit", permission: "audit.view" },
  { path: "/admin/validation-analytics", icon: BarChart3, label: "admin.validationAnalytics", permission: "analytics.view" },
  { path: "/admin/roles", icon: KeyRound, label: "admin.roles", permission: "roles.view" },
  { path: "/admin/settings", icon: Settings, label: "admin.settings", permission: "settings.view" },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  moderator: "Moderador",
  user: "Usuario",
};

export function AdminSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { can, role } = usePermissions();

  const visibleItems = navItems.filter((item) => can(item.permission));

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">The Remainder</h1>
        <p className="text-sm text-muted-foreground">Panel de Administración</p>
        {role && (
          <span className="mt-2 inline-block rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-medium text-moss">
            {ROLE_LABELS[role] ?? role}
          </span>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-moss/10 text-moss"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>
      </div>
    </aside>
  );
}
