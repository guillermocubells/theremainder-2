import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'C:/Users/Techalth Labs/Downloads/Frondaprima  - Stock List.xlsx';
const OUT_SQL = 'C:/Users/Techalth Labs/the-remainder/repo/scripts/seed-plants.sql';
const OUT_JSON = 'C:/Users/Techalth Labs/the-remainder/repo/scripts/catalogo-recuperado.json';

const wb = XLSX.read(readFileSync(SRC), { type: 'buffer' });
const rows = XLSX.utils
  .sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  .filter(r => typeof r.price === 'number'); // descarta la fila de instrucciones

// ── helpers de serializacion ──
const s = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? 'NULL' : `'${t.replace(/'/g, "''")}'`;
};
const num = (v) => {
  if (v === '' || v === null || v === undefined) return 'NULL';
  const n = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? String(n) : 'NULL';
};
const bool = (v) => {
  const t = String(v).trim().toUpperCase();
  if (t === 'TRUE') return 'true';
  if (t === 'FALSE') return 'false';
  return 'NULL';
};
const list = (v) =>
  String(v ?? '')
    .split('|')
    .map(x => x.trim())
    .filter(Boolean);
const arr = (v) => {
  const items = list(v);
  return items.length ? `ARRAY[${items.map(s).join(', ')}]::text[]` : 'NULL';
};
const jsonArr = (v) => {
  const items = list(v);
  return items.length ? `'${JSON.stringify(items).replace(/'/g, "''")}'::jsonb` : 'NULL';
};
const jsonObj = (v) => {
  const t = String(v ?? '').trim();
  if (!t) return 'NULL';
  try { return `'${JSON.stringify(JSON.parse(t)).replace(/'/g, "''")}'::jsonb`; }
  catch { return 'NULL';}
};
// Los enums no aceptan basura: si el valor no esta en la lista, va NULL.
const enumOf = (v, allowed) => {
  const t = String(v ?? '').trim().toLowerCase();
  return allowed.includes(t) ? `'${t}'` : 'NULL';
};

const PLANT_TYPE = ['palm', 'fern', 'tree', 'cycad', 'shrub', 'other', 'succulent', 'grass'];
const DIFFICULTY = ['easy', 'intermediate', 'advanced', 'beginner', 'expert'];
const RARITY = ['low', 'medium', 'high', 'rare', 'common', 'uncommon', 'very_rare', 'extremely_rare'];
const LEVEL = ['low', 'medium', 'high'];

const COLS = [
  'slug', 'name', 'scientific_name', 'common_name', 'variety',
  'description', 'short_description', 'notes',
  'price', 'sale_price', 'stock_qty',
  'container_size', 'germination_date', 'weight_grams',
  'family', 'plant_type', 'difficulty', 'rarity',
  'growth_rate', 'mature_height', 'mature_width',
  'origin_country', 'origin_region', 'native_habitat',
  'hardiness_zones', 'climate_zones', 'exposure', 'plant_use',
  'min_temp_c', 'water', 'humidity',
  'care_instructions', 'curious_facts', 'specifications',
  'images', 'image_alt_text', 'reference_url',
  'meta_title', 'meta_description',
  'is_active', 'is_featured',
];

const warnings = [];

// La hoja tipaba las cicadas como 'other' pese a que el enum tiene 'cycad'.
// Error de origen: plantGroup dice "Cícadas" sin ambiguedad posible.
const plantType = (r) => {
  const declarado = String(r['db.plant_type'] ?? '').trim().toLowerCase();
  const grupo = String(r.plantGroup ?? '').trim().toLowerCase();
  if (grupo.startsWith('cícada') || grupo.startsWith('cicada')) {
    if (declarado !== 'cycad') warnings.push(`${r.id}: plant_type '${declarado}' -> 'cycad' (plantGroup="${r.plantGroup}")`);
    return 'cycad';
  }
  return declarado;
};

const values = rows.map((r) => {
  if (String(r['db.thumbnail_url'] ?? '').trim() && !String(r['db.thumbnail_url']).includes('/')) {
    warnings.push(`${r.id}: db.thumbnail_url no es una URL ("${r['db.thumbnail_url']}") — se omite`);
  }
  if (!list(r.images).length) warnings.push(`${r.id}: sin imagenes`);

  return '  (' + [
    s(r['db.slug'] || r.id),
    s(r.name),
    s(r['db.scientific_name'] || r.name),
    s(r.commonName),
    s(r.variety),
    s(r.description),
    s(r['db.short_description']),
    s(r.notes),
    num(r.price),
    num(r['db.sale_price']),
    num(r['db.stock_qty'] !== '' ? r['db.stock_qty'] : r.quantity),
    s(r.containerSize),
    s(r.germinationDate),
    num(r.weightGrams),
    s(r['detail.family']),
    enumOf(plantType(r), PLANT_TYPE),
    enumOf(r['db.difficulty'], DIFFICULTY),
    enumOf(r['db.rarity'], RARITY),
    s(r.growthRate),
    s(r['db.mature_height'] || r['detail.height']),
    s(r['db.mature_width']),
    s(r['db.origin_country']),
    s(r['db.origin_region'] || r['detail.origin']),
    s(r['db.native_habitat']),
    arr(r.hardinessZones || r['db.hardiness_zone']),
    arr(r['db.climate_zones']),
    arr(r['db.exposure']),
    arr(r['db.plant_use']),
    num(r['db.min_temp_c']),
    enumOf(r['db.water'], LEVEL),
    enumOf(r['db.humidity'], LEVEL),
    jsonArr(r['db.care_instructions'] || r['detail.careInstructions']),
    jsonArr(r['db.curious_facts'] || r['detail.curiousFacts']),
    jsonObj(r['db.specifications']),
    arr(String(r.images).replace(/\n/g, ' ')),
    s(r['detail.imageDescription']),
    s(r.link),
    s(r['db.meta_title']),
    s(r['db.meta_description']),
    bool(r['db.is_active']) === 'NULL' ? 'true' : bool(r['db.is_active']),
    bool(r['db.is_featured']) === 'NULL' ? 'false' : bool(r['db.is_featured']),
  ].join(', ') + ')';
});

const sql = `-- Catalogo de The Remainder recuperado desde "Frondaprima - Stock List.xlsx" (07-feb-2026).
--
-- Origen: el backend de Supabase quedo inaccesible (proyecto pausado), asi que el
-- catalogo se reconstruyo desde la hoja de carga original que estaba en Downloads.
-- ${rows.length} especies. Las cantidades son las de febrero: verifica el stock antes de vender.
--
-- Idempotente: re-ejecutarlo actualiza por slug en vez de duplicar.
-- Requiere que las migraciones de la tabla plants ya esten aplicadas.

INSERT INTO public.plants (
${COLS.map(c => '  ' + c).join(',\n')}
) VALUES
${values.join(',\n')}
ON CONFLICT (slug) DO UPDATE SET
${COLS.filter(c => c !== 'slug').map(c => `  ${c} = EXCLUDED.${c}`).join(',\n')},
  updated_at = now();
`;

writeFileSync(OUT_SQL, sql, 'utf8');
writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), 'utf8');

console.log(`SQL escrito:  ${OUT_SQL}  (${rows.length} plantas, ${sql.length} bytes)`);
console.log(`JSON escrito: ${OUT_JSON}`);
if (warnings.length) {
  console.log(`\nAvisos (${warnings.length}):`);
  warnings.forEach(w => console.log('  - ' + w));
}
