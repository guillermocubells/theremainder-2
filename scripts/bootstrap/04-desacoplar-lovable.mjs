// Corta las dependencias de Lovable que NO necesitan credenciales.
// Uso:  node scripts/bootstrap/04-desacoplar-lovable.mjs            (simulacion)
//       node scripts/bootstrap/04-desacoplar-lovable.mjs --aplicar  (escribe)
//
// Lo que este script NO puede hacer, porque exige una cuenta del dueno:
//   - Crear el proyecto de Supabase propio (paso 1 del README)
//   - Sustituir LOVABLE_API_KEY por un proveedor de IA propio: hay que editar
//     supabase/functions/recommend-plants/index.ts y ai-plant-autocomplete/index.ts
//     con el host y el modelo del proveedor nuevo, y dar de alta el secreto.
//
// Idempotente: re-ejecutarlo no rompe nada y no vuelve a tocar lo ya hecho.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const APLICAR = process.argv.includes('--aplicar')

// Dominio real de la tienda; el canonical de index.html ya apunta aqui.
const DOMINIO = 'https://theremainder.pl'

const cambios = [
  {
    f: 'index.html',
    desc: 'Quitar el script de terceros cdn.gpteng.co (se ejecuta en la pagina de pago)',
    marcador: 'gpteng.co',
    // El comentario "DO NOT REMOVE THIS SCRIPT TAG" es una instruccion del editor
    // de Lovable, no una dependencia del producto: nada en src/ referencia gpteng.
    buscar: /[ \t]*<!--[^]*?gptengineer[^]*?-->\n?|[ \t]*<script src="https:\/\/cdn\.gpteng\.co\/gptengineer\.js"[^>]*><\/script>\r?\n?/g,
    poner: ''
  },
  {
    f: 'index.html',
    desc: 'Quitar el metadato de autoria de Lovable',
    marcador: 'content="Lovable"',
    buscar: /[ \t]*<meta name="author" content="Lovable" \/>\r?\n?/g,
    poner: ''
  },
  {
    f: 'public/robots.txt',
    desc: 'Apuntar el sitemap al dominio propio, no al subdominio de Lovable',
    marcador: 'theremainder.lovable.app',
    buscar: /Sitemap: https:\/\/theremainder\.lovable\.app\/sitemap\.xml/g,
    poner: `Sitemap: ${DOMINIO}/sitemap.xml`
  },
  {
    f: 'vite.config.ts',
    desc: 'Quitar el import de lovable-tagger',
    marcador: 'from "lovable-tagger"',
    // TRAMPA: el import es de nivel superior. Si se borra la devDependency de
    // package.json sin quitar TAMBIEN estas dos lineas, falla la carga del config
    // y se rompe `vite build` en produccion, no solo en desarrollo.
    buscar: /import \{ componentTagger \} from "lovable-tagger";\r?\n/g,
    poner: ''
  },
  {
    f: 'vite.config.ts',
    desc: 'Quitar la invocacion de componentTagger()',
    marcador: 'componentTagger(),',
    buscar: /[ \t]*mode === 'development' && componentTagger\(\),\r?\n/g,
    poner: ''
  },
  {
    f: 'package.json',
    desc: 'Quitar la devDependency lovable-tagger',
    marcador: '"lovable-tagger":',
    buscar: /[ \t]*"lovable-tagger": "\^?[\d.]+",\r?\n/g,
    poner: ''
  },
  {
    f: 'src/pages/PrivacyPolicy.tsx',
    desc: 'Declarar el proveedor real de infraestructura (es un documento legal)',
    marcador: 'Lovable Cloud',
    buscar: /Proveedor de hosting e infraestructura:<\/strong> Lovable Cloud, Supabase/g,
    poner: 'Proveedor de hosting e infraestructura:</strong> Supabase'
  },
  {
    f: 'src/pages/PrivacyPolicy.tsx',
    // Lovable Analytics se declara como encargado del tratamiento y NO existe:
    // no hay ningun script de analitica en el codigo. Se declaraba un encargado
    // inexistente mientras se omitia el de gpteng.co, que si se cargaba.
    desc: 'Quitar "Lovable Analytics": no hay ninguna analitica instalada',
    marcador: 'Lovable Analytics',
    buscar: /[ \t]*<li><strong className="text-foreground">Analítica:<\/strong> Lovable Analytics<\/li>\r?\n?/g,
    poner: ''
  }
]

// NO TOCAR: scripts/verificacion/recuperar-imagenes.mjs busca la cadena literal
// 'lovable-uploads' en blobs del historial de git. Esos blobs contienen esa
// cadena y siempre la contendran. Si un renombrado masivo toca ese fichero, el
// script deja de encontrar nada y se pierde la unica via de recuperar el mapeo
// imagen->planta. Por eso aqui no hay ninguna regla sobre public/lovable-uploads:
// esa carpeta se renombra desde correcciones.json ("carpeta_imagenes"), que
// regenera la semilla a la vez, para que la ruta del disco y la de la base de
// datos no se puedan desincronizar.
const EXCLUIDO = 'scripts/verificacion/recuperar-imagenes.mjs'

let hechos = 0, yaEstaba = 0, rotos = 0
const porFichero = new Map()

// "No ha cambiado nada" es AMBIGUO: puede significar que ya estaba hecho, o que
// el patron no ha encontrado nada y el cambio ha fallado en silencio. Son el caso
// bueno y el caso peor, y se ven exactamente igual.
// Ya nos mordio una vez aqui: los ficheros tienen fin de linea CRLF y los patrones
// anclaban en \n, asi que vite.config.ts salia como "ya hecho" con las dos lineas
// de lovable-tagger intactas. Si ademas se hubiera quitado la devDependency de
// package.json (ese patron SI casaba), el import de nivel superior habria quedado
// huerfano y `vite build` se rompe en PRODUCCION, no solo en desarrollo.
// Por eso el no-cambio no se interpreta: se desempata leyendo el marcador.
for (const c of cambios) {
  const abs = path.join(REPO, c.f)
  if (!fs.existsSync(abs)) { console.log(`  ??  no existe   ${c.f}`); rotos++; continue }
  const antes = porFichero.get(c.f) ?? fs.readFileSync(abs, 'utf8')
  const despues = antes.replace(c.buscar, c.poner)

  if (antes === despues) {
    if (antes.includes(c.marcador)) {
      // El marcador sigue ahi: el patron no casa. Es un fallo, no un no-op.
      console.log(`  XX  FALLO      ${c.f}: ${c.desc}`)
      console.log(`      el patron no casa pero "${c.marcador}" sigue en el fichero`)
      rotos++
    } else {
      console.log(`  --  ya hecho   ${c.f}: ${c.desc}`)
      yaEstaba++
    }
    continue
  }

  // Cinturon y tirantes: tras sustituir, el marcador no puede seguir vivo.
  if (despues.includes(c.marcador)) {
    console.log(`  XX  PARCIAL    ${c.f}: ${c.desc}`)
    console.log(`      ha cambiado algo pero "${c.marcador}" sigue en el fichero`)
    rotos++
    continue
  }

  porFichero.set(c.f, despues)
  console.log(`  ${APLICAR ? 'OK ' : '~~ '} ${APLICAR ? 'aplicado' : 'pendiente'}  ${c.f}: ${c.desc}`)
  hechos++
}

// Si algo ha fallado NO se escribe nada. Aplicar la mitad de los cambios es el
// escenario que rompe el build: quitar la devDependency y dejar vivo el import.
if (rotos) {
  console.log(`\nABORTADO: ${rotos} cambios no se han podido verificar. No se ha escrito nada.`)
  console.log('Arregla los patrones antes de volver a ejecutar; a medias es peor que sin hacer.')
  process.exit(1)
}

if (APLICAR) {
  for (const [f, contenido] of porFichero) fs.writeFileSync(path.join(REPO, f), contenido)
}

console.log(`\n${hechos} cambios ${APLICAR ? 'aplicados' : 'pendientes'}, ${yaEstaba} ya estaban hechos.`)
console.log(`Excluido a proposito: ${EXCLUIDO} (mina el historial de git buscando la cadena literal).`)

if (!APLICAR && hechos) console.log('\nEsto ha sido una simulacion. Para escribir: --aplicar')
if (APLICAR && hechos) {
  console.log('\nAhora, en este orden:')
  console.log('  npm install        (regenera el lockfile sin lovable-tagger)')
  console.log('  npm run build      (debe seguir compilando: verificado, el plugin era solo de desarrollo)')
}

console.log('\nLo que sigue atado a Lovable y NO arregla este script:')
console.log('  - LOVABLE_API_KEY en supabase/functions/recommend-plants/ y ai-plant-autocomplete/')
console.log('    (buscador con IA y autocompletado del admin; sin fallback, devuelven 500)')
console.log('  - El proyecto de Supabase original, que es de Lovable y esta pausado')
