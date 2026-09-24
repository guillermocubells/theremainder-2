import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const REPO = 'C:/Users/Techalth Labs/the-remainder/repo';
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });

// Todos los blobs de la historia que mencionan lovable-uploads.
const commits = git('rev-list', '--all').trim().split('\n');
console.log(`commits: ${commits.length}`);

const seenBlob = new Set();
const blobs = [];

// Recorre el arbol de cada commit buscando ficheros de datos; barato porque
// solo miramos rutas candidatas en vez de todo el arbol.
const CANDIDATE = /(plants|plant-?detail|catalog|seed|data)/i;

for (const c of commits) {
  let tree;
  try { tree = git('ls-tree', '-r', c, '--name-only'); } catch { continue; }
  for (const path of tree.split('\n')) {
    if (!path || !CANDIDATE.test(path)) continue;
    if (!/\.(ts|tsx|json|csv|sql)$/.test(path)) continue;
    let hash;
    try { hash = git('rev-parse', `${c}:${path}`).trim(); } catch { continue; }
    if (seenBlob.has(hash)) continue;
    seenBlob.add(hash);
    blobs.push({ commit: c, path, hash });
  }
}
console.log(`blobs unicos en rutas de datos: ${blobs.length}`);

// name/id -> imagenes
const mapping = new Map();
let withImages = 0;

for (const b of blobs) {
  let content;
  try { content = git('cat-file', '-p', b.hash); } catch { continue; }
  if (!content.includes('lovable-uploads')) continue;
  withImages++;

  // Trocea por entrada de objeto y asocia el id/slug con las imagenes que lo siguen.
  const entries = content.split(/\}\s*,\s*\{/);
  for (const e of entries) {
    const id = e.match(/\bid:\s*"([^"]+)"/)?.[1]
            || e.match(/\bslug:\s*"([^"]+)"/)?.[1]
            || e.match(/"id"\s*:\s*"([^"]+)"/)?.[1];
    const name = e.match(/\bname:\s*"([^"]+)"/)?.[1]
              || e.match(/"name"\s*:\s*"([^"]+)"/)?.[1];
    if (!id && !name) continue;
    const imgs = [...e.matchAll(/lovable-uploads\/([0-9a-f-]{36}\.\w+)/g)].map(m => m[1]);
    if (!imgs.length) continue;
    const key = id || name;
    if (!mapping.has(key)) mapping.set(key, { id, name, images: new Set() });
    imgs.forEach(i => mapping.get(key).images.add(i));
  }
}

console.log(`blobs con imagenes: ${withImages}`);
console.log(`\nplantas con imagenes recuperadas del historial: ${mapping.size}\n`);

const out = {};
[...mapping.entries()]
  .sort((a, b) => b[1].images.size - a[1].images.size)
  .forEach(([k, v]) => {
    out[k] = { name: v.name ?? null, images: [...v.images] };
    console.log(`  ${String(v.images.size).padStart(2)} img  ${k}${v.name && v.name !== k ? '  (' + v.name + ')' : ''}`);
  });

const total = new Set(Object.values(out).flatMap(v => v.images));
console.log(`\nimagenes distintas mapeadas: ${total.size}`);

writeFileSync('C:/Users/Techalth Labs/the-remainder/repo/scripts/imagenes-recuperadas.json',
  JSON.stringify(out, null, 2), 'utf8');
console.log('escrito: repo/scripts/imagenes-recuperadas.json');
