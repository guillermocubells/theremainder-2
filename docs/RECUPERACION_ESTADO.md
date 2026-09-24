# Estado de la recuperación — The Remainder

> **RESUELTO el 24-sep-2026.** Este documento describe el diagnostico de
> agosto-septiembre y se conserva por el rastro. La hipotesis central resulto
> equivocada: si habia cuenta propia de Supabase (creada el 7-sep, posterior a
> este documento). Se migro a un proyecto propio, `siemsknmxdcufuissqza`, en la
> organizacion personal. Procedimiento en `scripts/bootstrap/README.md`.


Última actualización: 1 de septiembre de 2026.
Documento de retomada: qué se hizo, qué está a medias y por dónde seguir.

---

## 1. El problema

El backend de Supabase (`qsjnjitjbegtrxgwqygg`) está **pausado**. Diagnóstico por
sondeo de endpoints (31-ago):

| Endpoint | Respuesta |
|---|---|
| `/auth/v1/health` | 200 |
| `/rest/v1/` (sin clave) | 401 |
| `/rest/v1/plants` | timeout |
| Storage | 544 |
| Edge functions | timeout |

La pasarela responde, el Postgres no existe. Firma de proyecto pausado.

**Consecuencia visible:** theremainder.pl carga el diseño entero pero muestra
**"0 plantas"**. La tienda parece sana y no vende nada. Nadie avisa de esto.

## 2. Por qué no se puede reactivar (todavía)

No es un problema técnico: *Restore project* es un botón. Es un problema de
propiedad. Evidencia recogida:

- **Cero correos de Supabase** en todo el buzón, incluidos spam y papelera. Ni
  alta, ni factura, ni el aviso de pausa. Si hubiera cuenta propia, existirían.
- Sí hay correos de Lovable, todos a `g.cubells@loomee.health`. Uno de jun-2025
  dice literalmente que *nunca* se había conectado un backend.
- Supabase **no ofrece login con Google**. Opciones reales: GitHub, ChatGPT, SSO,
  email+contraseña.

**Hipótesis principal:** el proyecto lo provisionó y lo posee Lovable. Por eso no
aparece con ninguna identidad propia.

### Coordenadas del proyecto

| Dato | Valor |
|---|---|
| Proyecto Lovable (real) | `1095a52a-510b-4b2a-a333-3f0476b7605e` — "The remainder" |
| Creado | 30-ene-2026 · 717 mensajes · 542 ediciones IA |
| Workspace | "Guillermo Cubells Personal" (user `guillermocub`) |
| Proyecto Supabase | `qsjnjitjbegtrxgwqygg` |
| Subdominio | `theremainder` |

> **Cuidado con el señuelo:** existe otro proyecto llamado "The remainder 10/02/26"
> (11 mensajes, propiedad de `g.cubells@loomee.health`). **No es ese.**

## 3. Qué se ha recuperado ya (sin acceso a Supabase)

### Catálogo — completo

Fuente: `C:\Users\Techalth Labs\Downloads\Frondaprima  - Stock List.xlsx` (07-feb-2026).
Las demás plantillas de Downloads están casi vacías; esta no.

**40 especies** (26 palmeras, 7 árboles, 5 arbustos, 2 cícadas) · **99 unidades** ·
**2.271 €** de inventario · precios de 5 € a 65 €.

- `scripts/seed-plants.sql` — idempotente por slug, mapeado al esquema real
- `scripts/catalogo-recuperado.json` — volcado crudo

Verificado ejecutándolo contra Postgres real (PGlite): **13/13**. Sin enums
inválidos, acentos y comillas tipográficas intactos, totales cuadrando.

Corrección aplicada sobre el origen: las 2 cícadas venían como `plant_type: other`
pese a existir el valor `cycad`. Error de la hoja.

### Imágenes — parcial pero mucho mejor de lo esperado

- **58 archivos, 18,7 MB**, físicamente en `public/lovable-uploads/`. No se perdieron.
- El mapeo planta → imagen vivía en la BD. Reconstruido desde el historial de git
  (1091 commits, 273 blobs de datos): **54 de 58 imágenes** asociadas a 12 plantas.
- `scripts/imagenes-recuperadas.json`

⚠️ **Trampa a revisar al retomar:** varias de esas 12 plantas (brahea-armata,
dicksonia-sp, caryota-obtusa, basselinia-favieri, chuniophoenix-hainanensis,
zamia-integrifolia, cyathea-sp) **no están** en el Stock List de 40. El catálogo
cambió con el tiempo. Además `sabal-miamensis` (histórico) vs `sabal-miamiensis`
(actual): los slugs no casan. Hay que conciliar antes de cargar.

### Lo que NO se ha recuperado

**Pedidos, clientes, facturas, disputas y reputación.** Siguen dentro del proyecto
pausado. No hay copia local ni archivo externo (Wayback no tiene ni una captura de
theremainder.pl ni del subdominio de Lovable).

## 4. Trabajo terminado en paralelo: sistema de roles

Ver `docs/AUTH_ROLES.md`. Resumen: se sustituyó el candado binario "¿eres admin?"
por permisos granulares. `superadmin > admin > moderator > user`, 27 permisos,
`<RoleGuard permission="...">`, pantalla `/admin/roles`.

Verificado con PGlite: **44/44 aserciones**. Migraciones **no aplicadas** a ninguna
base de datos.

## 5. Por dónde seguir

1. **Panel de backend dentro del editor de Lovable.** Es la vía más directa y quedó
   sin explorar: hacen falta clics dentro del editor y ahí se puede disparar
   generación de código, así que requiere supervisión.
2. **Descartar la hipótesis alternativa** (2 min): en Supabase, *Continue with
   GitHub*; y *Forgot password* con ambos emails. Si llega correo, la cuenta existe.
3. **Soporte de Lovable** (`hi@lovable.dev`) con las coordenadas de arriba. Pedir
   dos cosas: reactivar el backend **y transferir la propiedad** del proyecto
   Supabase. Solo lo primero deja el mismo problema para la próxima vez.
4. **Camino paralelo que no depende de nadie:** crear un Supabase propio, aplicar
   las 128 migraciones, cargar `seed-plants.sql` y tener tienda en pie. El catálogo
   ya está a salvo.

**Hay reloj.** Los proyectos pausados no esperan indefinidamente.

## 6. Scripts de verificación

En `scripts/verificacion/` (Node + PGlite, autónomos; **no** enganchados a vitest —
esa decisión sigue abierta):

| Script | Qué hace |
|---|---|
| `verificar-roles.mjs` | 44 aserciones sobre las migraciones de roles |
| `verificar-seed.mjs` | 13 aserciones sobre `seed-plants.sql` |
| `generar-seed.mjs` | Regenera el seed desde el XLSX |
| `recuperar-imagenes.mjs` | Reconstruye el mapeo imagen→planta desde git |
| `listar-catalogo.mjs` | Lista legible del catálogo recuperado |

Requieren `@electric-sql/pglite` y `xlsx` (no están en `package.json`).

## 7. Decisiones abiertas

- ¿Convertir las 44 aserciones de roles en test permanente de vitest? Añadiría
  PGlite como dependencia de desarrollo.
- ¿Conciliar las 12 plantas históricas con imágenes contra las 40 del Stock List?
- ¿Reactivar el proyecto viejo o arrancar limpio con el v2?

## 8. Contraseña de la cuenta admin — ACCIÓN PENDIENTE

La contraseña es `123456789` y quedó escrita en el historial de una conversación.
Esa cuenta además sería `superadmin` con el sistema de roles nuevo.

**No se puede cambiar todavía.** Sondeo del 1-sep: `/auth/v1/health` y
`/auth/v1/settings` dan timeout — Supabase Auth está caído junto con el Postgres.
La tabla `auth.users` es inalcanzable, así que ninguna vía funciona (ni web, ni
dashboard, ni CLI).

Mientras el backend esté muerto, esa contraseña tampoco le sirve a nadie. La
exposición es real pero inerte. **Se vuelve urgente en el momento del Restore:
cambiarla debe ser la primera acción, antes que ninguna otra.**

### Cómo cambiarla (cuando vuelva)

theremainder.pl/auth → "¿Olvidaste tu contraseña?" → email → enlace → contraseña
nueva. No pide la antigua. Usa `resetPassword` + `updatePassword` de AuthContext,
que ya están implementados.

### Endurecimiento aplicado (1-sep)

`src/lib/passwordPolicy.ts` + `src/test/password-policy.test.ts` (18/18).

Antes: `z.string().min(6)` y nada más. Por eso `123456789` pasó.

Ahora, para alta y restablecimiento: mínimo **12** caracteres, veto a la lista de
contraseñas filtradas, ni solo dígitos, ni secuencias, ni patrones repetidos.
Enfoque NIST SP 800-63B: manda la longitud, no las reglas de composición.

⚠️ **Detalle que no hay que romper:** el login **no** valida fuerza, a propósito.
Si lo hiciera, la cuenta con la contraseña vieja no podría entrar — justo lo que
necesita para cambiarla. Hay un test que protege esa asimetría.

⚠️ **Alcance real:** esto es validación de cliente. Frena el uso normal pero no a
quien llame a la API directamente. La barrera de verdad se activa en el dashboard
de Supabase (Authentication → Policies), y eso exige acceso de propietario, que
sigue bloqueado.
