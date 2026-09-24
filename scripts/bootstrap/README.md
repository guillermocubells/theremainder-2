# Bootstrap — levantar The Remainder en un Supabase propio

Este kit reconstruye la tienda entera **sin Lovable y sin el proyecto de Supabase
original**. Todo lo necesario esta en este repositorio.

## Por que existe

El backend original (`qsjnjitjbegtrxgwqygg`) lo provisiono Lovable, no es nuestro,
y se pausa. Cuando se pausa, la tienda carga el diseno y muestra cero productos:
la pasarela responde, el Postgres no existe. Nadie avisa.

Firma del proyecto pausado, por si vuelve a pasar:

| Endpoint | Sano | Pausado |
|---|---|---|
| `/auth/v1/health` | 200 rapido | 200 tras ~25 s |
| `/rest/v1/` sin clave | 401 | 401 |
| `/rest/v1/plants` | 200 con filas | **timeout** |
| `/storage/v1/bucket` | 400 | **544** |
| Edge functions | 200 | **timeout** |

## Los 4 ficheros, en orden

| | Que hace | Necesita tu cuenta |
|---|---|---|
| `00-entorno-local.sql` | Emula el andamiaje de Supabase (auth, storage, roles) para poder probar en local | no |
| `02-seed-catalogo.sql` | Las 40 plantas. **Generado**, no editar a mano | no |
| `03-admin.sql` | Crea el primer administrador | si (tu email) |
| `04-desacoplar-lovable.mjs` | Corta las referencias a Lovable del codigo | no |

Falta un `01`: es `scripts/seed-categories.sql`, que ya existia y no se ha tocado.

## Auto-test (no necesita cuenta, ni Docker, ni internet)

```bash
npm install
node scripts/bootstrap/verificar.mjs
```

Levanta un Postgres real en WASM, aplica las 128 migraciones, siembra categorias y
catalogo, y **comprueba el resultado contra valores esperados**. Salida actual:

```
migraciones aplicadas: 115/128
  OK   total            =  40   esperado 40
  OK   precio_cero      =   0   esperado 0
  OK   sin_familia      =   0   esperado 0
  OK   sin_categoria    =   0   esperado 0
  OK   tipo_other       =   0   esperado 0
  OK   familia coherente con el genero en las 40 filas
  OK   sin_imagen       =  36   esperado 36
  precios: 5.00 - 65.00
```

### Por que el auto-test compara contra un numero esperado y no contra "cero huecos"

Porque "cero huecos" fue verde con el catalogo entero a 0 EUR. Casi todas las
columnas interesantes tienen valor por defecto:

```
plants.images         TEXT[]  DEFAULT '{}'    -> "images IS NULL" da 0 SIEMPRE
plants.price          NUMERIC DEFAULT 0       -> "price IS NULL"  da 0 SIEMPRE
plants.display_order  INT NOT NULL DEFAULT 0  -> nunca es NULL
```

El motor rellena la casilla solo, asi que un recuento de nulos deja de medir el
mapeo y pasa a medir la diligencia de Postgres, que nunca falla. La version
anterior de este auto-test informaba `sin_imagenes: 0` con 36 de 40 plantas sin
una sola foto. **Un hueco se comprueba por su valor vacio (`= 0`, `= '{}'`), nunca
por NULL**, y toda asercion lleva su numero esperado al lado.

### Limites del auto-test

Las 13 migraciones que no aplican **en local** se listan por nombre al final de la
salida, nunca como un numero suelto, y cada una se clasifica como `previsto` o
`INESPERADO`. Todas dependen de `pg_net`, `pg_cron`, `pg_trgm`, `unaccent` o de la
publicacion `supabase_realtime`, que no existen en PGlite. En un Supabase real
deben aplicar las 128.

Consecuencia que conviene tener presente: **la busqueda queda sin probar en
local.** `plant_search_index`, `search_catalog` y la columna `tags` viven en esas
13 migraciones. El auto-test valida el catalogo, no el buscador.

## Puesta en marcha real

### 1. Crear el proyecto — esto lo haces tu

En [supabase.com/dashboard](https://supabase.com/dashboard), con **tu** cuenta:
*New project* -> region **Europa (Frankfurt o Irlanda)** -> anota la contrasena de
la base de datos.

> Hazlo en un plan de pago o vigila la inactividad: **los proyectos gratuitos se
> pausan solos a los 7 dias sin uso.** Eso es exactamente lo que nos trajo aqui.

### 2. Aplicar el esquema

```bash
npx supabase login          # abre el navegador; la sesion es tuya
npx supabase link --project-ref <tu-ref>
npx supabase db push        # aplica las 128 migraciones
```

> **Antes de nada, commitea las dos migraciones de agosto.** Hoy estan en disco
> pero sin trackear:
> `20260828120000_add_superadmin_role.sql` y `20260828120100_granular_permissions.sql`.
> Un `git clone` seguido de `db push` produce una base SIN el rol `superadmin`,
> SIN los 27 permisos, sin `role_permissions` y con la version antigua de
> `has_role()`. Son justo los dos ficheros escritos a mano: los otros 126 vienen
> de Lovable con nombre UUID.

### 3. Sembrar el catalogo

En el **SQL Editor** del panel, en este orden exacto:

1. `scripts/seed-categories.sql`
2. `scripts/bootstrap/02-seed-catalogo.sql`
3. `scripts/seed-categories.sql` **otra vez**

La tercera pasada no es un error. El paso 3 de `seed-categories.sql` asigna
`category_id` derivandolo de `plant_type`, asi que tiene que correr *despues* de
que existan las plantas. Es idempotente. Sin esa segunda pasada las 40 fichas
quedan sin categoria y no aparecen en ninguna seccion de la tienda.

Comprobacion: `select count(*) from plants;` -> **40**, y
`select count(*) from plants where category_id is null;` -> **0**.

### 4. Crear tu usuario administrador

1. Registrate en la tienda con el email que vayas a usar (la cuenta tiene que
   existir antes; el script solo reparte roles).
2. SQL Editor -> pega `scripts/bootstrap/03-admin.sql` -> cambia el email -> Run.

Sin esto **no hay ningun administrador**. El bootstrap de la migracion promociona
al admin mas antiguo que encuentre, y sobre una base nueva `user_roles` esta
vacia: no hay a quien promocionar, nadie obtiene `roles.manage`, y la pantalla de
roles nace muerta. Funciona desde el SQL Editor porque alli `auth.uid()` es NULL y
el trigger `guard_user_roles` —que prohibe tocarse los propios roles— no se
dispara. Esa es la via de recuperacion prevista.

### 5. Apuntar la aplicacion al proyecto nuevo

```bash
cp .env.example .env     # y rellena los tres valores de Project Settings -> API
```

Anade `.env` al `.gitignore`: hoy esta commiteado con las coordenadas del proyecto
de Lovable.

### 6. Variables de las edge functions

Estan todas listadas en `.env.example`, con que funcion usa cada una. **No uses la
tabla de `docs/BACKEND_API.md`**: lista 3 de los 8 secretos, y quien se guie por
ella tendra los webhooks de Stripe y los avisos de restock fallando en silencio.

Dos trampas: `STRIPE_WEBHOOK_SECRET` hay que **regenerarlo** (es por endpoint, y el
proyecto nuevo da una URL nueva), y `VITE_STRIPE_PUBLISHABLE_KEY` hay que darlo de
alta **tambien como secreto de edge function**, aunque lleve prefijo `VITE_`.

Despliega con `npx supabase functions deploy`.

### 7. Cortar el resto de Lovable

```bash
node scripts/bootstrap/04-desacoplar-lovable.mjs            # simulacion
node scripts/bootstrap/04-desacoplar-lovable.mjs --aplicar  # escribe
npm install && npm run build
```

Quita 8 cosas: el script de `cdn.gpteng.co` (un tercero ejecutando codigo en la
pagina de pago), el `<meta author>`, el sitemap que apuntaba a
`theremainder.lovable.app`, las tres piezas de `lovable-tagger` y las dos
declaraciones falsas de la politica de privacidad (declaraba "Lovable Analytics",
que no existe en el codigo, y omitia gpteng.co, que si se cargaba).

Verificado: con los 8 cambios aplicados, `vite build` compila (72 entradas PWA,
las mismas que antes).

> `lovable-tagger` son **tres** piezas y hay que quitarlas juntas: `package.json`,
> el `import` de nivel superior de `vite.config.ts` y su invocacion. Si se borra
> solo la dependencia, falla la carga del config y se rompe `vite build` **en
> produccion**, no solo en desarrollo.

## El recomendador de IA — esto no lo arregla ningun script

Dos edge functions llaman a `https://ai.gateway.lovable.dev/v1/chat/completions`
con `Bearer ${LOVABLE_API_KEY}`, una credencial del workspace de Lovable que muere
con la cuenta. **Ninguna tiene fallback**: las dos fallan en duro.

| Funcion | Que se rompe | Sintoma |
|---|---|---|
| `recommend-plants` | El buscador con IA de la tienda | 500, `recommendations: []` |
| `ai-plant-autocomplete` | El autocompletado del alta de plantas del admin | 500 |

La sustitucion es mecanica, no una reescritura: la pasarela es compatible con la
API de OpenAI, asi que basta cambiar host, clave y nombre de modelo (Google AI
Studio, OpenRouter, etc.). Dos detalles que el proveedor nuevo tiene que soportar:
`recommend-plants` usa `response_format: {type: json_object}`, y
`ai-plant-autocomplete` usa `tools` + `tool_choice` forzado y `image_url`
multimodal.

## Las imagenes: 4 de 40, y no hay mas en el repo

Hay 58 PNG en `public/lovable-uploads/` (no 61). `scripts/imagenes-recuperadas.json`
los mapea a 12 plantas **historicas**, de las que solo 4 corresponden a una planta
del catalogo actual: una coincide exacta y tres necesitan reconciliar el slug.

| slug historico | slug del catalogo | por que |
|---|---|---|
| `magnolia-laevifolia` | `magnolia-laevifolia` | coincide |
| `sabal-miamensis` | `sabal-miamiensis` | erratum de slug |
| `chamaedorea-elegans` | `chamaedorea-elegans-negrita` | misma especie, variedad |
| `rhopalostylis-sapida` | `rhopalostylis-sapida-var-oceana` | misma especie, variedad |

Las otras 8 son especies que ya no se venden. **36 de 40 fichas saldran con
`/placeholder.svg`**, y el auto-test lo afirma explicitamente para que nadie lo
descubra en produccion.

No hacen falta Storage ni credenciales: en runtime la cadena de la base de datos se
usa tal cual, asi que `/lovable-uploads/x.png` se sirve desde `public/`. El Storage
de Supabase solo interviene al SUBIR imagenes nuevas desde el admin.

**No se usan las URLs externas** que traia `scripts/seed-plants.sql` para 7 plantas
(wikimedia, palmtalk, etsystatic, wixstatic...): son hotlinks a servidores de
terceros, se rompen en silencio y son un problema de derechos de imagen en una
tienda que cobra.

### Renombrar la carpeta

Cambia `carpeta_imagenes` en `correcciones.json`, renombra la carpeta y regenera la
semilla. La ruta del disco y la de la base de datos salen del mismo sitio, asi que
no se pueden desincronizar.

**No toques `scripts/verificacion/recuperar-imagenes.mjs`**: busca la cadena
literal `lovable-uploads` en blobs del historial de git, que siempre la
contendran. Un sed masivo lo dejaria sin encontrar nada.

## Regenerar la semilla

```bash
node scripts/bootstrap/generar-seed.mjs
```

Lee `scripts/catalogo-recuperado.json` + `correcciones.json`. Las correcciones
estan en un JSON revisable, no enterradas en 40 tuplas de SQL.

### Que corrige, y por que no es criterio inventado

**La familia botanica estaba mal en 23 de las 40.** El campo `detail.family` del
JSON esta corrupto: la columna se ordeno sola en la hoja de origen y quedo
desplazada. Las 26 primeras filas dicen todas `Arecaceae` —incluidas tres
magnolias, una Dracaena y una Euphorbia— y las familias reales se apilan en las 14
ultimas, asignadas a la especie equivocada (`quercus-sp` = Zamiaceae,
`sabal-palmetto-lisa` = Magnoliaceae).

Lo peligroso es que **ninguna fila es invalida por si sola**: el campo esta relleno
al 100%, todos los valores son familias reales y bien escritas. Un chequeo de
nulos, uno de formato y uno de dominio lo habrian dado por bueno los tres. Solo
aparece al cruzar la familia con el genero de la misma fila. Por eso el generador
**ignora `detail.family` y deriva la familia del genero**, y el auto-test la
verifica cruzandola, no comprobando que no sea nula.

**5 plantas llegaban como `plant_type = 'other'`**, que `seed-categories.sql` deja
deliberadamente sin categoria: no habrian aparecido en ninguna seccion. La
correccion sale del campo `plantGroup` del propio JSON, que si es correcto en las
40: "Cicadas" -> `cycad` (ceratozamia, zamia), "Arbustos ornamentales" -> `shrub`
(ixora, heptapleurum, vitis).

### Otras trampas del mapeo, ya resueltas

- **El precio real NO esta en `db.price`** (es `null` en las 40), sino en el campo
  `price` del nivel superior. Como la columna tiene default `0`, una comprobacion
  de nulos da "sin huecos" con los 40 precios a cero.
- **`description` no tiene clave `db.`**: vive solo en el nivel superior, asi que
  un mapeo que solo lea `db.*` pierde la descripcion larga de las 40.
- `db.sun_requirement` y `db.water_requirement` son los campos **antiguos**, en
  castellano (`"Pleno sol"`, `"Regular"`). Los buenos, ya normalizados al enum,
  son `db.exposure` y `db.water`.
- `db.thumbnail_url` contiene **nombres de planta, no URLs**, en las 40 sin
  excepcion. Ademas la columna se elimino en febrero.
- 6 de las 34 claves `db.` apuntan a columnas que una migracion de febrero elimino
  o renombro. El JSON esta escrito contra el esquema de hace siete meses.
- `db.display_order` viene vacio en las 40 y la columna es `NOT NULL DEFAULT 0`: si
  no se inserta, el orden por defecto del catalogo queda empatado y arbitrario. El
  generador lo asigna.
- `ON CONFLICT (slug) DO UPDATE`, no `DO NOTHING`: si re-siembras tras corregir un
  dato, la correccion tiene que propagarse. Con `DO NOTHING` la fila vieja y
  erronea sobrevive en silencio.

## Dos cosas que solo resuelve un Supabase real

El auto-test no puede desambiguarlas porque stubbea las extensiones:

1. **`pg_net`**: se declara `WITH SCHEMA extensions` y 49 lineas despues se invoca
   `net.http_post(...)`. El esquema declarado y el invocado no coinciden. O falla
   el `CREATE EXTENSION`, o pasa y el trigger de restock revienta en runtime. Hay
   que unificarlo. La misma pareja esta copiada en otras tres migraciones.
2. **`pg_cron`**: cuatro migraciones lo habilitan, tres con `WITH SCHEMA
   pg_catalog` y una con `WITH SCHEMA extensions`. Solo se salva por el orden
   lexicografico y por `IF NOT EXISTS`. Ademas **no hay una sola llamada a
   `cron.schedule`** en las 128 migraciones: la extension se arrastra por copia y
   pega y nadie la ha ejercitado.

## Por que esto es exportable

El resultado no queda atado a Supabase. Lo que produce el kit son **artefactos
planos**: 128 ficheros `.sql` estandar, un `INSERT` en SQL plano sin sintaxis
propietaria, y PNG en el repositorio. Sirven contra cualquier Postgres —RDS, Neon,
autoalojado o el siguiente Supabase—. Lo unico especifico de Supabase es la capa de
`auth`, `storage` y RLS, y `00-entorno-local.sql` documenta exactamente que hace
falta emular para prescindir de ella.
