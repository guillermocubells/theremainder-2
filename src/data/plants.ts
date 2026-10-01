export interface Plant {
  /** Slug. Es lo que va en la URL y lo que usa el carrito. */
  id: string;
  /**
   * UUID de `plants.id`. Hace falta para las tablas que referencian la planta
   * por clave ajena —`stock_notifications.plant_id` es UUID, no texto—, donde
   * mandar el slug devuelve `22P02 invalid input syntax for type uuid`.
   */
  uuid?: string;
  name: string;
  variety: string;
  quantity: number;
  commonName: string;
  description: string;
  link: string;
  location: string;
  light: string;
  growthRate: string;
  notes: string;
  price?: number;
  images?: string[];
  productImages?: string[];
  primaryImage?: string | null;
  hardinessZones?: string[]; // USDA hardiness zones with sub-zones (e.g., ["8a", "8b", "9a"])
  climateZones?: string[]; // Climate type zones (e.g., ["tropical", "mediterraneo", "atlantico"])
  ornamentalValue?: 'Convencional' | 'Bonito' | 'Hermoso' | 'Impresionante' | 'Único';
  waterNeeds?: 'Baja' | 'Moderada' | 'Alta';
  plantGroup?: 'Palmeras' | 'Helechos arbóreos' | 'Cícadas' | 'Árboles ornamentales' | 'Arbustos ornamentales' | 'Bambús' | 'Hierbas' | 'Bromeliáceas' | 'Heliconias' | 'Estrelicias' | 'Jengibres' | 'Plátanos' | 'Agaves y yucas' | 'Aráceas' | 'Suculentas' | 'Cactus' | 'Coníferas' | 'Perennes';
  containerSize?: string;
  germinationDate?: string;
  weightGrams?: number;
}

/**
 * Catalogo de prueba del prototipo. VACIO a proposito.
 *
 * Contenia 6 fichas inventadas que se consultaban ANTES que la base de datos en
 * `usePlant`, el buscador guiado, las plantas relacionadas, los avisos de stock
 * y las sugerencias del carrito. Resultado en produccion: `magnolia-laevifolia`
 * se vendia a 90 EUR cuando en la base valia 22 y tenia stock 0, y cinco slugs
 * inexistentes pintaban una ficha de producto con boton de compra.
 *
 * Un respaldo que se consulta antes de la fuente real no es un respaldo: es la
 * fuente. Precio y stock salen SIEMPRE de `plants` en Supabase. Si vuelve a
 * hacer falta un catalogo local, que sea para tests, nunca importado por la
 * aplicacion.
 */
export const plants: Plant[] = [];
