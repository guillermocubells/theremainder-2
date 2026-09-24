import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, KeyRound, UserPlus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, type AppRole } from "@/hooks/account/usePermissions";
import {
  useRoleAssignments,
  useRolePermissions,
  useFindUserByEmail,
  useAssignRole,
  useRevokeRole,
  type RoleAssignment,
} from "@/hooks/account/useRoleManagement";

const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  moderator: "Moderador",
  user: "Usuario",
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  superadmin: "Todo, incluido repartir roles",
  admin: "Gestiona la tienda entera, pero no reparte roles",
  moderator: "Moderación, disputas y reportes de fraude. Sin pedidos ni facturas",
  user: "Cliente de la tienda, sin acceso al panel",
};

const ROLE_STYLES: Record<AppRole, string> = {
  superadmin: "bg-forest text-white hover:bg-forest",
  admin: "bg-moss/15 text-moss hover:bg-moss/15",
  moderator: "bg-stone/15 text-stone hover:bg-stone/15",
  user: "bg-muted text-muted-foreground hover:bg-muted",
};

const ASSIGNABLE_ROLES: AppRole[] = ["superadmin", "admin", "moderator"];

export default function AdminRoles() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can("roles.manage");

  const { data: assignments = [], isLoading } = useRoleAssignments();
  const { data: rolePermissions = {} } = useRolePermissions();

  const findUser = useFindUserByEmail();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("moderator");
  const [revoking, setRevoking] = useState<RoleAssignment | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const found = await findUser.mutateAsync(email);
      if (!found) {
        toast.error("No hay ninguna cuenta con ese email");
        return;
      }

      await assignRole.mutateAsync({ userId: found.user_id, role });
      toast.success(`${ROLE_LABELS[role]} concedido a ${found.email}`);
      setEmail("");
    } catch (error) {
      // Los candados de Postgres (auto-promoción, último superadmin) llegan aquí.
      const message = error instanceof Error ? error.message : "Error al asignar el rol";
      toast.error(message);
    }
  };

  const handleRevoke = async () => {
    if (!revoking) return;

    try {
      await revokeRole.mutateAsync({ userId: revoking.user_id, role: revoking.role });
      toast.success("Rol revocado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al revocar el rol";
      toast.error(message);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-2">
        <KeyRound className="h-6 w-6 text-moss" />
        <h1 className="text-2xl font-bold text-foreground">Roles y permisos</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Quién puede hacer qué dentro del panel.
      </p>

      {canManage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Conceder un rol</CardTitle>
            <CardDescription>
              La cuenta debe existir ya. Se busca por email exacto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label htmlFor="role-email">Email</Label>
                <Input
                  id="role-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="persona@ejemplo.com"
                  autoComplete="off"
                />
              </div>

              <div className="sm:w-56">
                <Label htmlFor="role-select">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={findUser.isPending || assignRole.isPending}
                className="gap-2"
              >
                {findUser.isPending || assignRole.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Conceder
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-3">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Roles asignados</CardTitle>
          <CardDescription>
            Solo aparecen las cuentas que tienen algún rol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-moss" />
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">
              Todavía no hay roles asignados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Desde</TableHead>
                  {canManage && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const isSelf = a.user_id === user?.id;

                  return (
                    <TableRow key={`${a.user_id}-${a.role}`}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {a.full_name ?? "—"}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{a.email ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ROLE_STYLES[a.role]}>{ROLE_LABELS[a.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(a.granted_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "No puedes modificar tus propios roles"
                                : "Revocar rol"
                            }
                            onClick={() => setRevoking(a)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qué puede cada rol</CardTitle>
          <CardDescription>
            La matriz vive en la base de datos, no en el código del panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {ASSIGNABLE_ROLES.map((r) => (
            <div key={r}>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={ROLE_STYLES[r]}>{ROLE_LABELS[r]}</Badge>
                <span className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(rolePermissions[r] ?? []).map((p) => (
                  <span
                    key={p}
                    className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Revocar rol
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revoking && (
                <>
                  Vas a quitarle el rol de{" "}
                  <strong>{ROLE_LABELS[revoking.role]}</strong> a{" "}
                  <strong>{revoking.email ?? revoking.full_name ?? "esta cuenta"}</strong>.
                  Perderá el acceso inmediatamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>Revocar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
