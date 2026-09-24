import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'; import path from 'node:path'
const REPO=path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const db=await new PGlite(); await db.exec(fs.readFileSync(new URL('00-entorno-local.sql', import.meta.url),'utf8'))
let mig=0
for(const f of fs.readdirSync(REPO+'/supabase/migrations').filter(x=>x.endsWith('.sql')).sort()){
  try{ await db.exec(fs.readFileSync(path.join(REPO,'supabase/migrations',f),'utf8')); mig++ }catch(e){}
}
const sql=fs.readFileSync(new URL('02-seed-catalogo.sql', import.meta.url),'utf8')
const stmts=sql.split(/;\s*\n\s*\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('--')&&!/^(BEGIN|COMMIT)$/i.test(s))
let ok=0; const errs={}
for(const st of stmts){
  if(/^(BEGIN|COMMIT)/i.test(st)) continue
  try{ await db.exec(st+';'); ok++ }
  catch(e){ const m=String(e.message).split('\n')[0].slice(0,100); errs[m]=(errs[m]||0)+1 }
}
console.log(`migraciones: ${mig}/128`)
console.log(`sentencias semilla aplicadas: ${ok}/${stmts.length}`)
if(Object.keys(errs).length){ console.log('ERRORES:'); for(const[m,n]of Object.entries(errs)) console.log(`  x${n} ${m}`) }
const n=(await db.query('select count(*)::int c from public.plants')).rows[0].c
console.log(`\n>>> FILAS EN plants: ${n} <<<`)
if(n){
  const s=(await db.query('select name, slug, price, stock_qty, plant_type, exposure, hardiness_zones from public.plants order by price desc nulls last limit 3')).rows
  s.forEach(r=>console.log('  '+JSON.stringify(r)))
  const g=(await db.query(`select count(*) filter(where price is null)::int sin_precio, count(*) filter(where scientific_name is null)::int sin_cientifico, count(*) filter(where exposure is null)::int sin_exposicion, count(*) filter(where images is null)::int sin_imagenes, count(*) filter(where price is null or price=0)::int precio_cero, round(min(price),2)::text precio_min, round(max(price),2)::text precio_max from public.plants`)).rows[0]
  console.log('\nhuecos:',JSON.stringify(g))
}
