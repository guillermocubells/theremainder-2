/**
 * Rescate de un service worker atascado.
 *
 * El 1-oct-2026 la tienda cargaba la cabecera, el hero y el pie, y el catalogo
 * se quedaba en esqueleto de carga indefinidamente. La causa estaba en el
 * navegador, no en el despliegue: un service worker anterior seguia mandando y
 * la primera peticion a Supabase tardo 129 segundos, mientras que la del
 * catalogo no llegaba a salir. La unica salida era borrar los datos del sitio a
 * mano, que ningun comprador va a hacer.
 *
 * `skipWaiting` y `clientsClaim` ya estan puestos en la configuracion del PWA,
 * pero solo sirven cuando el navegador consigue descargar e instalar el worker
 * nuevo. Si el viejo tiene la red tomada, esa actualizacion puede no llegar, y
 * entonces no hay nada que rescate al visitante desde dentro.
 *
 * Esto es el ultimo recurso: si pasado `MARGEN_MS` la aplicacion no ha dado
 * senal de haber cargado datos, se desregistran los workers, se vacian las
 * caches y se recarga UNA vez. La marca va en `sessionStorage`, asi que un
 * fallo real del servidor no produce un bucle de recargas: el segundo arranque
 * fallido ya no hace nada y el usuario ve el error de verdad.
 */

const MARCA_RESCATE = "tr_sw_rescate";
const MARGEN_MS = 20_000;

let temporizador: ReturnType<typeof setTimeout> | null = null;
let arrancado = false;

/** La aplicacion ha conseguido datos: se cancela el rescate. */
export function marcarArranqueCorrecto(): void {
  arrancado = true;
  if (temporizador !== null) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  try {
    sessionStorage.removeItem(MARCA_RESCATE);
  } catch {
    /* modo privado o almacenamiento bloqueado */
  }
}

async function purgarYRecargar(): Promise<void> {
  try {
    sessionStorage.setItem(MARCA_RESCATE, "1");
  } catch {
    // Sin sessionStorage no hay forma de recordar que ya se intento, y sin esa
    // memoria el rescate se repetiria en bucle. Mejor no tocar nada.
    return;
  }

  try {
    if ("serviceWorker" in navigator) {
      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));
    }
  } catch {
    /* si falla la limpieza, se recarga igual: puede bastar */
  }

  window.location.reload();
}

/** Arranca el vigilante. Se llama una vez, al montar la aplicacion. */
export function armarVigilante(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Si venimos de un rescate, no se intenta otro: o la pagina carga, o lo que
  // falla no es el service worker y hay que dejar que se vea el fallo.
  try {
    if (sessionStorage.getItem(MARCA_RESCATE) === "1") return;
  } catch {
    return;
  }

  // Sin service worker instalado no hay nada que purgar.
  navigator.serviceWorker.getRegistrations().then((registros) => {
    if (registros.length === 0 || arrancado) return;
    temporizador = setTimeout(() => {
      if (!arrancado) void purgarYRecargar();
    }, MARGEN_MS);
  }).catch(() => {
    /* sin acceso al registro no se puede vigilar */
  });
}
