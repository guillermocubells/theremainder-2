// Genera 02-seed-catalogo.sql desde catalogo-recuperado.json + correcciones.json.
// Uso: node scripts/bootstrap/generar-seed.mjs
//
// Por que existe un generador y no un .sql a mano: las correcciones de datos
// (familia, plant_type, imagenes) quedan en un JSON revisable en vez de enterradas
// en 40 tuplas SQL, y la ruta de las imagenes se deriva de un solo sitio.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')
const cat = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/catalogo-recuperado.json'), 'utf8'))
const fix = JSON.parse(fs.readFileSync(path.join(HERE, 'correcciones.json'), 'utf8'))
const imgMap = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/imagenes-recuperadas.json'), 'utf8'))

const CARPETA = fix.carpeta_imagenes
const DIR_IMG = path.join(REPO, 'public', CARPETA)

const ARRAYS = new Set(['climate_zones', 'exposure', 'hardiness_zones', 'images', 'plant_use', 'product_images', 'tags'])
const JSONB = new Set(['care_instructions', 'curious_facts', 'specifications'])
const NUMS = new Set(['price', 'sale_price', 'stock_qty', 'min_temp_c', 'weight_grams', 'display_order'])
const RENAME = { hardiness_zone: 'hardiness_zones' }

// Columnas que una migracion de febrero elimino o renombro. Un INSERT que las
// incluya falla con "column does not exist". El JSON sigue trayendolas.
//   20260207114223 -> DROP de thumbnail_url, is_in_stock, sun_requirement,
//                     water_requirement, temperature_range
//   20260207121725 -> hardiness_zone (text) sustituida por hardiness_zones (text[])
// Ademas: db.sun_requirement/db.water_requirement son los campos ANTIGUOS en
// castellano ("Pleno sol", "Regular"); los buenos, ya normalizados al enum, son
// db.exposure y db.water. Y db.thumbnail_url contiene nombres de planta, no URLs,
// en las 40 filas sin excepcion.
const DROP = new Set(['is_in_stock', 'thumbnail_url', 'temperature_range', 'sun_requirement', 'water_requirement'])

// db.category_id viene vacio en las 40 y no puede venir de otro sitio: categories.id
// es gen_random_uuid(), asi que cualquier id literal seria invalido tras re-sembrar.
// Lo resuelve el paso 3 de seed-categories.sql derivandolo de plant_type.
const DROP_SIEMPRE = new Set(['category_id'])

const blank = v => v === '' || v === null || v === undefined
const q = s => "'" + String(s).replace(/'/g, "''") + "'"
const lit = (col, v) => {
  if (blank(v)) return 'NULL'
  if (ARRAYS.has(col)) {
    const a = Array.isArray(v) ? v : String(v).split('|').map(s => s.trim()).filter(Boolean)
    return a.length ? 'ARRAY[' + a.map(q).join(',') + ']::text[]' : 'NULL'
  }
  if (JSONB.has(col)) {
    if (typeof v === 'object') return q(JSON.stringify(v)) + '::jsonb'
    try { JSON.parse(v); return q(v) + '::jsonb' }
    catch { return q(JSON.stringify(String(v))) + '::jsonb' }
  }
  if (NUMS.has(col)) { const n = Number(v); return Number.isFinite(n) ? String(n) : 'NULL' }
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return q(v)
}

// Invertimos el mapa historico->catalogo para resolver por slug de catalogo.
const imgPorSlugCatalogo = {}
for (const [historico, destino] of Object.entries(fix.imagenes_slug_historico_a_catalogo)) {
  const entrada = imgMap[historico]
  if (!entrada) { console.warn('AVISO: ' + historico + ' no esta en imagenes-recuperadas.json'); continue }
  const faltan = entrada.images.filter(f => !fs.existsSync(path.join(DIR_IMG, f)))
  if (faltan.length) console.warn('AVISO: faltan ficheros de ' + historico + ': ' + faltan.join(', '))
  const presentes = entrada.images.filter(f => fs.existsSync(path.join(DIR_IMG, f)))
  if (presentes.length) imgPorSlugCatalogo[destino] = presentes.map(f => '/' + CARPETA + '/' + f)
}

const avisos = []
const rows = []
let orden = 0

for (const p of cat) {
  const r = {}
  for (const [k, v] of Object.entries(p)) {
    if (!k.startsWith('db.')) continue
    let col = k.slice(3)
    if (DROP.has(col) || DROP_SIEMPRE.has(col)) continue
    col = RENAME[col] || col
    if (!blank(v)) r[col] = v
  }

  // El precio real NO esta en db.price (null en las 40), sino en el nivel superior.
  // Trampa: plants.price tiene default 0, asi que una comprobacion de nulos da
  // "sin huecos" con los 40 precios a cero. Hay que comprobar price=0, no price IS NULL.
  if (blank(r.price) && Number(p.price) > 0) r.price = Number(p.price)

  // 'name' es NOT NULL y solo existe en el nivel superior del JSON.
  if (!r.name && p.name) r.name = p.name
  if (!r.common_name && p.commonName) r.common_name = p.commonName
  if (!r.variety && p.variety) r.variety = p.variety
  if (!r.growth_rate && p.growthRate) r.growth_rate = p.growthRate
  if (!r.container_size && p.containerSize) r.container_size = p.containerSize
  if (!r.germination_date && p.germinationDate) r.germination_date = p.germinationDate
  if (blank(r.weight_grams) && p.weightGrams) r.weight_grams = p.weightGrams

  // description: existe en las 40 en el nivel superior y no tiene clave db.*,
  // asi que un mapeo que solo lea db.* la pierde entera.
  if (!r.description && p.description) r.description = p.description

  const slug = r.slug
  if (!slug) { avisos.push('fila sin slug: ' + p.name); continue }

  // Familia derivada del genero. NUNCA de detail.family (corrupto, ver correcciones.json).
  const genero = slug.split('-')[0]
  const familia = fix.familia_por_genero[genero]
  if (familia) r.family = familia
  else avisos.push('genero sin familia en correcciones.json: ' + genero + ' (' + slug + ')')

  // plant_type: correccion puntual de las 5 filas que llegan como 'other'
  // y que seed-categories.sql dejaria sin categoria.
  if (fix.plant_type_por_slug[slug]) r.plant_type = fix.plant_type_por_slug[slug]

  // Imagenes locales, si las hay. Sin hotlinks externos.
  if (imgPorSlugCatalogo[slug]) r.images = imgPorSlugCatalogo[slug]

  // display_order es NOT NULL DEFAULT 0. Si no se inserta, las 40 filas quedan a 0
  // y el .order('display_order') del catalogo deja un empate arbitrario.
  r.display_order = ++orden * 10

  rows.push(r)
}

const out = []
out.push('-- Semilla del catalogo de The Remainder. GENERADO - no editar a mano.')
out.push('-- Fuente: scripts/catalogo-recuperado.json + scripts/bootstrap/correcciones.json')
out.push('-- Regenerar: node scripts/bootstrap/generar-seed.mjs')
out.push('--')
out.push('-- SQL plano, sin sintaxis propietaria: vale en cualquier Postgres.')
out.push('-- Idempotente: re-ejecutarlo actualiza por slug en vez de duplicar.')
out.push('-- Requiere que las migraciones de la tabla plants ya esten aplicadas.')
out.push('')
out.push('BEGIN;')
out.push('')

for (const r of rows) {
  const cols = Object.keys(r).sort()
  const upd = cols.filter(c => c !== 'slug').map(c => '  "' + c + '" = EXCLUDED."' + c + '"').join(',\n')
  out.push('INSERT INTO public.plants (' + cols.map(c => '"' + c + '"').join(', ') + ')')
  out.push('VALUES (' + cols.map(c => lit(c, r[c])).join(', ') + ')')
  // DO UPDATE, no DO NOTHING: re-sembrar tras corregir un dato debe propagar la
  // correccion. Con DO NOTHING la fila vieja y erronea sobrevive en silencio.
  out.push('ON CONFLICT (slug) DO UPDATE SET\n' + upd + ';')
  out.push('')
}

out.push('COMMIT;')
fs.writeFileSync(path.join(HERE, '02-seed-catalogo.sql'), out.join('\n'))

const conImg = rows.filter(r => r.images).length
console.log('02-seed-catalogo.sql generado: ' + rows.length + ' plantas')
console.log('  familia asignada  : ' + rows.filter(r => r.family).length + '/' + rows.length)
console.log('  plant_type=other  : ' + rows.filter(r => r.plant_type === 'other').length + ' (deben ser 0: other no tiene categoria)')
console.log('  con imagen local  : ' + conImg + '/' + rows.length + '  (techo real del repo: 4)')
console.log('  sin imagen        : ' + (rows.length - conImg) + '/' + rows.length + '  <- saldran con /placeholder.svg')
if (avisos.length) { console.log('AVISOS:'); avisos.forEach(a => console.log('  - ' + a)) }
