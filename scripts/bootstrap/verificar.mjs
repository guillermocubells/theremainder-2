// Auto-test del kit de bootstrap. No necesita cuenta, ni Docker, ni internet.
// Uso: node scripts/bootstrap/verificar.mjs
//
// Levanta un Postgres real en WASM (PGlite), emula el andamiaje de Supabase,
// aplica las 128 migraciones y la semilla, y COMPRUEBA EL RESULTADO.
//
// Que NO prueba, y hay que saberlo (ver README, "Limites del auto-test"):
//   - pg_net / pg_cron / pg_trgm / unaccent no existen en PGlite: 13 migraciones
//     no aplican aqui. Se listan por nombre al final, nunca como un numero suelto.
//   - Por tanto plant_search_index y toda la busqueda quedan SIN probar en local.
//   - El esquema real de pg_net (net vs extensions) solo lo resuelve un Supabase
//     de verdad. Aqui esta stubbeado, asi que este test no puede desambiguarlo.
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')

// Fallos conocidos y explicados: faltan extensiones en PGlite, no son defectos
// del repo. Cualquier fallo FUERA de esta lista es una regresion real.
const ESPERADOS = /extension "(pg_net|pg_cron|pg_trgm|unaccent|pgcrypto)" is not available|publication "supabase_realtime" does not exist|operator class "gin_trgm_ops" does not exist|relation "public\.plant_search_index" does not exist/

const fallos = []
const db = new PGlite()
await db.exec(fs.readFileSync(path.join(HERE, '00-entorno-local.sql'), 'utf8'))

const migs = fs.readdirSync(path.join(REPO, 'supabase/migrations')).filter(f => f.endsWith('.sql')).sort()
let aplicadas = 0
for (const f of migs) {
  try { await db.exec(fs.readFileSync(path.join(REPO, 'supabase/migrations', f), 'utf8')); aplicadas++ }
  catch (e) { fallos.push({ f, msg: String(e.message).split('\n')[0].slice(0, 120) }) }
}

for (const f of ['seed-categories.sql']) {
  try { await db.exec(fs.readFileSync(path.join(REPO, 'scripts', f), 'utf8')) }
  catch (e) { fallos.push({ f, msg: String(e.message).split('\n')[0].slice(0, 120) }) }
}
const semilla = fs.readFileSync(path.join(HERE, '02-seed-catalogo.sql'), 'utf8')
try { await db.exec(semilla) }
catch (e) { fallos.push({ f: '02-seed-catalogo.sql', msg: String(e.message).split('\n')[0].slice(0, 200) }) }
// seed-categories es idempotente y el paso 3 asigna category_id derivandolo de
// plant_type, asi que hay que re-ejecutarlo DESPUES de sembrar las plantas.
try { await db.exec(fs.readFileSync(path.join(REPO, 'scripts/seed-categories.sql'), 'utf8')) }
catch (e) { fallos.push({ f: 'seed-categories.sql (2a pasada)', msg: String(e.message).split('\n')[0].slice(0, 120) }) }

const uno = async (sql) => (await db.query(sql)).rows[0]

// Las comprobaciones. Cada una dice que se espera y por que.
//
// TRAMPA CENTRAL, y la razon de que este fichero exista: casi todas las columnas
// interesantes tienen DEFAULT, asi que "IS NULL" no detecta nada.
//   plants.images         TEXT[]  DEFAULT '{}'   -> "images IS NULL" da 0 siempre
//   plants.price          NUMERIC DEFAULT 0      -> "price IS NULL" da 0 siempre
//   plants.display_order  INT NOT NULL DEFAULT 0 -> nunca es NULL
// Un hueco se comprueba por su VALOR VACIO (=0, ='{}'), nunca por NULL.
const r = await uno(`
  SELECT
    count(*)::int                                                              AS total,
    count(*) FILTER (WHERE price IS NULL OR price = 0)::int                    AS precio_cero,
    count(*) FILTER (WHERE coalesce(array_length(images,1),0) = 0)::int        AS sin_imagen,
    count(*) FILTER (WHERE family IS NULL OR family = '')::int                 AS sin_familia,
    count(*) FILTER (WHERE category_id IS NULL)::int                           AS sin_categoria,
    count(*) FILTER (WHERE plant_type = 'other')::int                          AS tipo_other,
    count(*) FILTER (WHERE display_order = 0)::int                             AS orden_cero,
    count(*) FILTER (WHERE description IS NULL OR description = '')::int       AS sin_descripcion,
    count(*) FILTER (WHERE NOT is_active)::int                                 AS inactivas,
    count(DISTINCT slug)::int                                                  AS slugs_unicos
  FROM public.plants
`)

// La familia correcta no es "no nula": es "coherente con el genero". El bug de
// origen tenia el campo relleno al 100% y mal en 23 de 40, asi que un chequeo de
// nulos lo habria dado por bueno. Se verifica cruzando contra el genero.
const fix = JSON.parse(fs.readFileSync(path.join(HERE, 'correcciones.json'), 'utf8'))
const plantas = (await db.query('SELECT slug, family, price, plant_type FROM public.plants ORDER BY slug')).rows
const familiaMal = plantas.filter(p => fix.familia_por_genero[p.slug.split('-')[0]] !== p.family)

const ESPERADO = { total: 40, precio_cero: 0, sin_familia: 0, sin_categoria: 0, tipo_other: 0, orden_cero: 0, sin_descripcion: 0, inactivas: 0, slugs_unicos: 40, sin_imagen: 36 }

console.log('\n=== ESQUEMA ===')
console.log(`migraciones aplicadas: ${aplicadas}/${migs.length}`)

console.log('\n=== CATALOGO ===')
let malas = 0
for (const [k, esperado] of Object.entries(ESPERADO)) {
  const v = r[k]
  const ok = v === esperado
  if (!ok) malas++
  const nota = k === 'sin_imagen' ? '  (techo real del repo: solo 4 de 40 tienen foto local)' : ''
  console.log(`  ${ok ? 'OK  ' : 'MAL '} ${k.padEnd(16)} = ${String(v).padStart(3)}   esperado ${esperado}${nota}`)
}
if (familiaMal.length) {
  malas++
  console.log(`  MAL  familia incoherente con el genero en ${familiaMal.length} filas:`)
  familiaMal.slice(0, 10).forEach(p => console.log(`        ${p.slug} -> ${p.family}`))
} else {
  console.log(`  OK   familia coherente con el genero en las ${plantas.length} filas`)
}

// Tipos de las columnas que la interfaz recorre con .map(). Una cadena donde se
// espera un array deja la ficha de producto en blanco y no lo delata ningun
// recuento: la fila existe y el campo no es nulo.
const malTipo = await uno(`SELECT count(*)::int n FROM public.plants
  WHERE jsonb_typeof(curious_facts) NOT IN ('array','null')
     OR jsonb_typeof(care_instructions) NOT IN ('array','null')`)
console.log(`  ${malTipo.n === 0 ? 'OK  ' : 'MAL '} jsonb_map_seguro  = ${malTipo.n}   esperado 0`)
if (malTipo.n !== 0) malas++

const pr = await uno('SELECT min(price)::text a, max(price)::text b FROM public.plants')
console.log(`  precios: ${pr.a} - ${pr.b}`)

console.log('\n=== MIGRACIONES QUE NO APLICAN EN LOCAL ===')
const inesperados = fallos.filter(x => !ESPERADOS.test(x.msg))
for (const x of fallos) console.log(`  ${ESPERADOS.test(x.msg) ? 'previsto ' : 'INESPERADO'} ${x.f.slice(0, 22)} | ${x.msg}`)
if (!fallos.length) console.log('  ninguna')

console.log('\n=== VEREDICTO ===')
if (malas === 0 && inesperados.length === 0) {
  console.log('OK. El kit reconstruye el catalogo. Lo unico que falta son fotos (36 de 40).')
} else {
  console.log(`FALLA: ${malas} comprobaciones de catalogo y ${inesperados.length} migraciones rotas sin explicar.`)
  process.exitCode = 1
}
