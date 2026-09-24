import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const wb = XLSX.read(readFileSync('C:/Users/Techalth Labs/Downloads/Frondaprima  - Stock List.xlsx'), { type: 'buffer' });
const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

// La primera fila del XLSX es la fila de instrucciones ("Precio (número)", etc.), no un producto.
const rows = raw.filter(r => typeof r.price === 'number');

console.log(`Plantas reales: ${rows.length}\n`);

const grupos = {};
let valorTotal = 0, unidades = 0;

rows.forEach((r, i) => {
  const g = r.plantGroup || 'Sin grupo';
  (grupos[g] ??= []).push(r);
  const q = Number(r.quantity) || 0;
  valorTotal += (Number(r.price) || 0) * q;
  unidades += q;
  console.log(
    `${String(i + 1).padStart(2)}. ${String(r.name).padEnd(38)} ` +
    `${String(r.price + '€').padStart(6)}  ` +
    `stock:${String(q).padStart(3)}  ` +
    `${String(r.containerSize).padEnd(7)} ${r.commonName || ''}`
  );
});

console.log('\n--- Por grupo ---');
Object.entries(grupos)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([g, list]) => console.log(`  ${String(list.length).padStart(2)}  ${g}`));

console.log('\n--- Totales ---');
console.log(`  Especies:        ${rows.length}`);
console.log(`  Unidades:        ${unidades}`);
console.log(`  Valor inventario: ${valorTotal.toFixed(2)} EUR`);
console.log(`  Con imagenes:    ${rows.filter(r => String(r.images).trim()).length}`);
console.log(`  Precio min/max:  ${Math.min(...rows.map(r => r.price))}€ / ${Math.max(...rows.map(r => r.price))}€`);
