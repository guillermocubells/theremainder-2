# Bootstrap — levantar The Remainder en un Supabase propio

Este kit reconstruye la tienda entera **sin Lovable y sin el proyecto de Supabase
original**. Todo lo necesario está en este repositorio.

## Por qué existe

El backend original (`qsjnjitjbegtrxgwqygg`) lo provisionó Lovable, no es nuestro,
y se pausa. Cuando se pausa, la tienda carga el diseño y muestra cero productos:
la pasarela responde, el Postgres no existe. Nadie avisa.

Firma del proyecto pausado, por si vuelve a pasar:

| Endpoint | Sano | Pausado |
|---|---|---|
| `/auth/v1/health` | 200 rápido | 200 tras ~25 s |
| `/rest/v1/` sin clave | 401 | 401 |
| `/rest/v1/plants` | 200 con filas | **timeout** |
| `/storage/v1/bucket` | 400 | **544** |
| Edge functions | 200 | **timeout** |

## Qué reconstruye, y qué está comprobado

Nada de lo de abajo es una suposición: `verificar.mjs` levanta un Postgres real
en WASM, aplica las migraciones y la semilla, y lo comprueba.

| Pieza | Origen | Estado |
|---|---|---|
| Esquema (116 tablas) | `supabase/migrations/` — 128 ficheros | **115/128 aplican en local** |
| Catálogo (40 plantas) | `scripts/catalogo-recuperado.json` | **40/40 insertadas, 5 €–65 €** |
| Imágenes | `public/lovable-uploads/` — 61 PNG | En el repo |
| Categorías | `scripts/seed-categories.sql` | — |

Las 13 migraciones que no aplican **en local** dependen de `pg_net`, `pg_cron`,
`pg_trgm`, `unaccent` y de la publicación `supabase_realtime`. Las cinco existen
en Supabase y las propias migraciones las declaran con `CREATE EXTENSION`; solo
faltan en el Postgres de juguete del auto-test. En un proyecto Supabase real
deben aplicar las 128.

## Auto-test (no necesita cuenta, ni Docker, ni internet)

```bash
npm install
node scripts/bootstrap/verificar.mjs
```

Levanta un Postgres en WASM, replica el esquema, siembra el catálogo y te dice
cuántas plantas han entrado y si algún precio se ha quedado a cero. Si esto pasa,
el kit funciona.

## Puesta en marcha real

### 1. Crear el proyecto — esto lo haces tú

En [supabase.com/dashboard](https://supabase.com/dashboard), con **tu** cuenta:
*New project* → región **Europa (Frankfurt o Irlanda)** → anota la contraseña de
la base de datos.

> Hazlo en un plan de pago o vigila la inactividad: **los proyectos gratuitos se
> pausan solos a los 7 días sin uso.** Eso es exactamente lo que nos trajo aquí.

### 2. Aplicar el esquema

```bash
npx supabase login          # abre el navegador; la sesión es tuya
npx supabase link --project-ref <tu-ref>
npx supabase db push        # aplica las 128 migraciones
```

### 3. Sembrar el catálogo

En el **SQL Editor** del panel, en este orden:

1. `scripts/seed-categories.sql`
2. `scripts/bootstrap/02-seed-catalogo.sql`

Comprueba: `select count(*) from plants;` → debe dar **40**.

### 4. Subir las imágenes

Crea un bucket **público** llamado `plant-images` y sube el contenido de
`public/lovable-uploads/`. El mapeo planta → fichero está en
`scripts/imagenes-recuperadas.json`.

### 5. Apuntar la aplicación al proyecto nuevo

`.env`, con los valores de *Project Settings → API*:

```
VITE_SUPABASE_URL=https://<tu-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<tu-clave-anon>
VITE_SUPABASE_PROJECT_ID=<tu-ref>
```

### 6. Variables de las edge functions

Las funciones de `supabase/functions/` leen sus secretos del entorno (Stripe,
Resend y demás). Hay que volver a declararlos en *Edge Functions → Secrets* del
proyecto nuevo, y desplegarlas con `npx supabase functions deploy`.

## Por qué esto es exportable

El resultado no queda atado a Supabase. Lo que produce el kit son **artefactos
planos**:

- El esquema son 128 ficheros `.sql` estándar
- El catálogo es un `INSERT` en SQL plano, sin sintaxis propietaria
- Las imágenes son PNG en el repositorio

Sirven contra cualquier Postgres: RDS, Neon, Postgres autoalojado o el siguiente
Supabase. Lo único específico de Supabase es la capa de `auth`, `storage` y RLS
—y `00-entorno-local.sql` documenta exactamente qué hace falta emular para
prescindir de ella.

## Regenerar la semilla

Si cambia `scripts/catalogo-recuperado.json`:

```bash
node scripts/bootstrap/generar-seed.mjs
```

### Trampas del mapeo, ya resueltas

Documentadas porque volverían a morder a quien regenere esto a mano:

- **El precio real NO está en `db.price`** (es `null` en las 40), sino en el
  campo `price` del nivel superior. Como la columna tiene default `0`, una
  comprobación de nulos da "sin huecos" con todos los precios a cero.
- `db.sun_requirement` y `db.water_requirement` son los campos **antiguos**, en
  castellano (`"Pleno sol"`, `"Regular"`). Los buenos, ya normalizados al enum,
  son `db.exposure` y `db.water`.
- `db.thumbnail_url` contiene **nombres de planta, no URLs**. Inservible.
- `db.hardiness_zone` (singular) sí es un renombrado real: la columna se llama
  `hardiness_zones` y es un array. Los valores vienen separados por `|`.
- `name` es `NOT NULL` y solo existe en el nivel superior del JSON.
