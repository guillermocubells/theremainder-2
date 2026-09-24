import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const seed = readFileSync('C:/Users/Techalth Labs/the-remainder/repo/scripts/seed-plants.sql', 'utf8');

// Tabla plants reducida a las columnas que toca el seed, con los enums reales.
await db.exec(`
  create type public.plant_type as enum ('palm','fern','tree','cycad','shrub','other','succulent','grass');
  create type public.difficulty_level as enum ('easy','intermediate','advanced','beginner','expert');
  create type public.rarity_level as enum ('low','medium','high','rare','common','uncommon','very_rare','extremely_rare');
  create type public.water_level as enum ('low','medium','high');
  create type public.humidity_level as enum ('low','medium','high');

  create table public.plants (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    scientific_name text, common_name text, variety text,
    description text, short_description text, notes text,
    price numeric(10,2) not null default 0,
    sale_price numeric(10,2),
    stock_qty integer not null default 0,
    container_size text, germination_date text, weight_grams integer,
    family text,
    plant_type public.plant_type,
    difficulty public.difficulty_level,
    rarity public.rarity_level,
    growth_rate text, mature_height text, mature_width text,
    origin_country text, origin_region text, native_habitat text,
    hardiness_zones text[], climate_zones text[], exposure text[], plant_use text[],
    min_temp_c numeric,
    water public.water_level,
    humidity public.humidity_level,
    care_instructions jsonb, curious_facts jsonb, specifications jsonb,
    images text[], image_alt_text text, reference_url text,
    meta_title text, meta_description text,
    is_active boolean not null default true,
    is_featured boolean not null default false,
    updated_at timestamptz not null default now()
  );
`);

console.log('=== Ejecutando seed-plants.sql ===');
try { await db.exec(seed); console.log('  OK  se aplica sin errores'); }
catch (e) { console.log('  ERROR:', e.message); process.exit(1); }

const q = async (sql) => (await db.query(sql)).rows;
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { if (c) { pass++; console.log(`  PASS  ${n}`); } else { fail++; console.log(`  FAIL  ${n} ${extra}`); } };

console.log('\n=== Integridad ===');
const [{ n }] = await q(`select count(*)::int as n from public.plants`);
ok('40 plantas insertadas', n === 40, `(${n})`);

const [{ nulos }] = await q(`select count(*)::int as nulos from public.plants where name is null or slug is null or price is null`);
ok('sin nombres, slugs ni precios nulos', nulos === 0, `(${nulos})`);

const [{ sinprecio }] = await q(`select count(*)::int as sinprecio from public.plants where price <= 0`);
ok('todos con precio > 0', sinprecio === 0, `(${sinprecio})`);

const [{ tipos }] = await q(`select count(*)::int as tipos from public.plants where plant_type is null`);
ok('todos con plant_type valido', tipos === 0, `(${tipos} sin tipo)`);

const [{ palmeras }] = await q(`select count(*)::int as palmeras from public.plants where plant_type = 'palm'`);
ok('26 palmeras', palmeras === 26, `(${palmeras})`);

const [{ zonas }] = await q(`select count(*)::int as zonas from public.plants where hardiness_zones is null`);
ok('todas con zonas de rusticidad', zonas === 0, `(${zonas} sin zonas)`);

const [{ cuidados }] = await q(`select count(*)::int as cuidados from public.plants where care_instructions is null`);
ok('todas con instrucciones de cuidado', cuidados === 0, `(${cuidados} sin cuidados)`);

const [{ specs }] = await q(`select count(*)::int as specs from public.plants where specifications is not null`);
ok('specifications parsea como jsonb', specs > 0, `(${specs})`);

const [{ stock, valor }] = await q(`select sum(stock_qty)::int as stock, sum(price*stock_qty)::numeric as valor from public.plants`);
ok('99 unidades de stock', stock === 99, `(${stock})`);
ok('inventario 2271 EUR', Number(valor) === 2271, `(${valor})`);

console.log('\n=== Idempotencia ===');
try {
  await db.exec(seed);
  const [{ n2 }] = await q(`select count(*)::int as n2 from public.plants`);
  ok('re-ejecutar no duplica', n2 === 40, `(${n2})`);
} catch (e) { ok('re-ejecutar no falla', false, e.message); }

console.log('\n=== Comillas y acentos ===');
const [ara] = await q(`select name, description, curious_facts from public.plants where slug = 'araucaria-angustifolia'`);
ok('texto con acentos intacto', /paisajístico|Conífera/.test(ara.description), ara.description?.slice(0, 60));
const [zam] = await q(`select name, meta_title from public.plants where slug like 'zamia%'`);
ok('nombre con comillas tipograficas sobrevive', !!zam, JSON.stringify(zam));

console.log('\n=== Muestra ===');
(await q(`select slug, price, stock_qty, plant_type, array_length(hardiness_zones,1) as zonas from public.plants order by price desc limit 5`))
  .forEach(r => console.log('  ', JSON.stringify(r)));

console.log(`\n=== RESULTADO: ${pass} pasan, ${fail} fallan ===`);
process.exit(fail === 0 ? 0 : 1);
