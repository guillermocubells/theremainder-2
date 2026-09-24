# Roles y permisos

Cómo se decide quién puede hacer qué, y qué hay que ejecutar al desplegar.

## El modelo

Autenticación: Supabase Auth (email + contraseña), sin cambios.

Autorización: tres piezas en Postgres.

| Pieza | Qué hace |
|---|---|
| `user_roles` | qué rol tiene cada persona |
| `role_permissions` | qué permisos trae cada rol |
| `has_permission(uid, perm)` | la pregunta que hace el código |

El código pregunta por **permiso**, no por rol. Añadir un rol nuevo es insertar filas
en `role_permissions`, no reescribir políticas RLS.

### Roles

| Rol | Rango | Alcance |
|---|---|---|
| `superadmin` | 3 | Todo, incluido repartir roles |
| `admin` | 2 | La tienda entera, **menos** `roles.manage` |
| `moderator` | 1 | Moderación, disputas y fraude en modo lectura. Sin pedidos, facturas ni ajustes |
| `user` | 0 | Cliente. Ningún acceso al panel |

La separación que justifica el nivel nuevo: **los admin llevan el negocio, el
superadmin decide quién es admin.**

### Jerarquía

`has_role()` respeta el rango: un `superadmin` satisface `has_role(uid,'admin')`.
Por eso las ~126 migraciones anteriores, que comprueban `has_role(uid,'admin')` o
`admin OR moderator`, siguen funcionando sin tocarlas.

Excepción: los roles de rango 0 (`user`) se comparan por igualdad exacta, para que
`has_role(uid,'user')` no dé `true` a cualquiera con un rol superior.

## Cómo se usa en el frontend

```tsx
// Ruta entera
<RoleGuard permission="orders.view"><AdminOrders /></RoleGuard>

// Un botón suelto
<Can permission="orders.manage"><Button>Reembolsar</Button></Can>

// Lógica
const { can, role } = usePermissions();
if (can("invoices.manage")) { /* ... */ }
```

`usePermissions()` resuelve todos los permisos de la sesión en **una** query
cacheada (5 min). Tras repartir roles se invalida con `useInvalidatePermissions()`.

> Los guards del frontend son UX, no seguridad. Quien decide de verdad es RLS en
> Postgres; el guard solo evita enseñar pantallas que la base de datos va a
> rechazar igualmente.

## Invariantes protegidas por trigger

RLS no puede expresarlas, así que van en `guard_user_roles()`:

1. **Nadie toca sus propios roles**, ni un superadmin. La promoción es siempre un
   acto de otra persona.
2. **No se puede quedar el sistema sin superadmin.**

`auth.uid()` es `NULL` desde el SQL editor o con `service_role`, así que la
recuperación manual sigue siendo posible si algo se atasca.

Todo cambio de rol se registra en `audit_logs` (`role.granted` / `role.revoked` /
`role.updated`), que ya encadena checksums.

## Al desplegar

Las migraciones **no se han ejecutado contra ninguna base de datos**. Al levantar
el Supabase del despliegue nuevo:

1. Aplicar en orden:
   - `20260828120000_add_superadmin_role.sql`
   - `20260828120100_granular_permissions.sql`

   Van separadas a propósito: Postgres permite `ALTER TYPE ... ADD VALUE` dentro de
   una transacción pero no usar ese valor en la misma. Mismo patrón que se siguió
   al añadir `moderator`. **No las fusiones en un solo archivo.**

2. El bootstrap promociona automáticamente al `admin` más antiguo a `superadmin`.
   Si la base es nueva y no hay ningún admin, no promociona a nadie: hay que crear
   el primero a mano desde el SQL editor.

   ```sql
   insert into public.user_roles (user_id, role)
   select user_id, 'superadmin' from public.profiles where email = 'TU_EMAIL';
   ```

3. Regenerar los tipos:

   ```bash
   supabase gen types typescript --project-id <ID> > src/integrations/supabase/types.ts
   ```

   `types.ts` se editó a mano para que el código compilase sin `any`. La
   regeneración debe reproducir lo mismo; si no, es que falta alguna migración.

4. Comprobar en el panel: `/admin/roles` lista los roles y la matriz de permisos.

## Pendiente

Esto cubre **autorización**. Sigue sin cubrirse el endurecimiento de la
**autenticación**: MFA, exigir email verificado, política de contraseñas y rate
limiting en el login.
