import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const REPO=path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const cat=JSON.parse(fs.readFileSync(REPO+'/scripts/catalogo-recuperado.json','utf8'))

const ARRAYS=new Set(['climate_zones','exposure','hardiness_zones','images','plant_use','product_images'])
const JSONB =new Set(['care_instructions','curious_facts','specifications'])
const NUMS  =new Set(['price','sale_price','stock_qty','min_temp_c','weight_grams','display_order'])
const RENAME={hardiness_zone:'hardiness_zones'}
// sun_requirement/water_requirement son los campos ANTIGUOS en castellano; db.exposure y db.water
// traen los mismos datos ya normalizados al enum. thumbnail_url contiene nombres, no URLs.
const DROP  =new Set(['is_in_stock','thumbnail_url','temperature_range','sun_requirement','water_requirement'])

const blank=v=>v===''||v===null||v===undefined
const q=s=>"'"+String(s).replace(/'/g,"''")+"'"
const lit=(col,v)=>{
  if(blank(v)) return 'NULL'
  if(ARRAYS.has(col)){
    const a=Array.isArray(v)?v:String(v).split('|').map(s=>s.trim()).filter(Boolean)
    return a.length?'ARRAY['+a.map(q).join(',')+']::text[]':'NULL'
  }
  if(JSONB.has(col)){
    if(typeof v==='object') return q(JSON.stringify(v))+'::jsonb'
    // Texto plano: lo envolvemos como cadena JSON valida en vez de romper la insercion
    try { globalThis.JSON.parse(v); return q(v)+'::jsonb' }
    catch { return q(globalThis.JSON.stringify(String(v)))+'::jsonb' }
  }
  if(NUMS.has(col)){ const n=Number(v); return Number.isFinite(n)?String(n):'NULL' }
  if(typeof v==='boolean') return v?'TRUE':'FALSE'
  return q(v)
}

const rows=[]
for(const p of cat){
  const r={}
  for(const [k,v] of Object.entries(p)){
    if(!k.startsWith('db.')) continue
    let col=k.slice(3)
    if(DROP.has(col)) continue
    col=RENAME[col]||col
    if(!blank(v)) r[col]=v
  }
  // 'name' es NOT NULL y solo vive en el nivel superior del JSON
  // db.price viene null en las 40; el precio real vive en el nivel superior
  if((r.price===undefined||r.price===null) && Number(p.price)>0) r.price=Number(p.price)
  if(!r.name && p.name) r.name=p.name
  if(!r.common_name && p.commonName) r.common_name=p.commonName
  if(!r.variety && p.variety) r.variety=p.variety
  if(!r.growth_rate && p.growthRate) r.growth_rate=p.growthRate
  if(!r.container_size && p.containerSize) r.container_size=p.containerSize
  if(!r.germination_date && p.germinationDate) r.germination_date=p.germinationDate
  if(!r.weight_grams && p.weightGrams) r.weight_grams=p.weightGrams
  if(!r.notes && p.notes) r.notes=p.notes
  if(!r.reference_url && p.link) r.reference_url=p.link
  if(r.stock_qty===undefined && p.quantity!==undefined) r.stock_qty=p.quantity
  if(!r.images && Array.isArray(p.images) && p.images.length) r.images=p.images
  if(!r.slug && r.name) r.slug=String(r.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  rows.push(r)
}

const cols=[...new Set(rows.flatMap(r=>Object.keys(r)))].sort()
let sql='-- Semilla del catalogo de The Remainder.\n-- Generado desde scripts/catalogo-recuperado.json. SQL plano: vale en cualquier Postgres.\n\nBEGIN;\n\n'
for(const r of rows){
  const used=cols.filter(c=>r[c]!==undefined)
  sql+=`INSERT INTO public.plants (${used.map(c=>'"'+c+'"').join(', ')})\nVALUES (${used.map(c=>lit(c,r[c])).join(', ')})\nON CONFLICT (slug) DO NOTHING;\n\n`
}
sql+='COMMIT;\n'
fs.writeFileSync(new URL('02-seed-catalogo.sql', import.meta.url),sql)
console.log(`generadas ${rows.length} inserciones, ${cols.length} columnas distintas`)
console.log('columnas:',cols.join(', '))
