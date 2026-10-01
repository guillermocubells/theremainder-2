-- ============================================================================
-- Zonas de envio — semilla
-- ============================================================================
--
-- POR QUE EXISTE ESTE FICHERO
--
-- `shipping_zones` se crea en la migracion de 2026-02-02 pero ninguna semilla
-- la rellenaba, asi que en produccion estaba VACIA. Consecuencia: la edge
-- function `calculate-shipping` respondia SHIPPING_NOT_AVAILABLE para todos los
-- paises, Espana incluida, y el checkout moria en el paso 1 con el boton
-- "Continuar" deshabilitado. Nadie podia comprar ni dejar una solicitud.
--
-- ============================================================================
-- CONFIRMA LOS NUMEROS ANTES DE EJECUTAR ESTO
-- ============================================================================
--
-- Hay TRES fuentes de tarifas en el proyecto y NO coinciden:
--
--   1. `src/utils/shippingCalculator.ts` (SHIPPING_ZONES)
--      Espana 8,00 EUR base, gratis a partir de 150 EUR, 2-4 dias.
--      Es la que usa HOY el carrito (`CartDrawer` enseña el umbral de 150 EUR)
--      y contra la que corren las pruebas de `src/test/shipping.test.ts`.
--      **Los valores de abajo salen de aqui**, para no contradecir lo que el
--      carrito ya le promete al cliente.
--
--   2. `src/pages/ShippingInfo.tsx` — la pagina publica de envios
--      Espana 7,40 EUR la primera planta y 2 EUR/kg la adicional, Seur 24-72 h.
--      Union Europea 16,50 EUR y 2,50 EUR/kg. Islas de Italia y Francia: 20 EUR
--      fijos adicionales. Esta es la que LEE EL COMPRADOR, y un precio
--      publicado es un compromiso.
--
--   3. Esta tabla, que es la unica que el checkout consulta de verdad.
--
-- Si las tarifas buenas son las de la pagina publica, hay que cambiar los
-- valores de abajo Y `shippingCalculator.ts`, o el carrito y el checkout
-- seguiran diciendo cosas distintas.
--
-- ============================================================================
-- UNA DIFERENCIA DE UNIDADES QUE IMPORTA
-- ============================================================================
--
-- `per_item_cost` se cobra POR UNIDAD ADICIONAL:
--     coste = base_cost + (unidades - 1) * per_item_cost
--
-- Pero las dos fuentes de arriba hablan de EUR POR KILO. No es lo mismo: una
-- planta en maceta de 35 cm pesa ~8 kg y aqui cuenta como una unidad. Con
-- estos valores, un pedido de plantas grandes se cobra por debajo de coste.
--
-- Mientras `plants.weight_grams` no este relleno en todo el catalogo no se
-- puede cobrar por peso de verdad. Hoy el envio sale barato en pedidos
-- grandes: tenlo presente antes de abrir la tienda a ventas de volumen.
--
-- ============================================================================
--
-- Idempotente: se puede volver a ejecutar tras corregir un valor y la
-- correccion se propaga (ON CONFLICT DO UPDATE, no DO NOTHING).
--
-- Comprobacion posterior:
--   select count(*) from shipping_zones where is_active;   -- 27
--   select * from shipping_zones where country_code = 'ES';

INSERT INTO public.shipping_zones
  (country_code, country_name, base_cost, per_item_cost,
   free_shipping_threshold, delivery_days_min, delivery_days_max, is_active)
VALUES
  -- Espana peninsular — Seur
  ('ES', 'España',           8.00,  1.50, 150.00, 2,  4,  true),

  -- Portugal
  ('PT', 'Portugal',        12.00,  2.00, 200.00, 3,  5,  true),

  -- Francia
  ('FR', 'Francia',         15.00,  2.50, 250.00, 4,  6,  true),

  -- Europa Central
  ('DE', 'Alemania',        18.00,  3.00, 300.00, 5,  8,  true),
  ('BE', 'Bélgica',         18.00,  3.00, 300.00, 5,  8,  true),
  ('NL', 'Países Bajos',    18.00,  3.00, 300.00, 5,  8,  true),
  ('LU', 'Luxemburgo',      18.00,  3.00, 300.00, 5,  8,  true),
  ('AT', 'Austria',         18.00,  3.00, 300.00, 5,  8,  true),

  -- Italia
  ('IT', 'Italia',          16.00,  2.80, 280.00, 4,  7,  true),

  -- Paises Nordicos — sin envio gratis
  ('SE', 'Suecia',          25.00,  4.00, NULL,   6,  10, true),
  ('DK', 'Dinamarca',       25.00,  4.00, NULL,   6,  10, true),
  ('FI', 'Finlandia',       25.00,  4.00, NULL,   6,  10, true),

  -- Europa del Este — sin envio gratis
  ('PL', 'Polonia',         22.00,  3.50, NULL,   6,  10, true),
  ('CZ', 'República Checa', 22.00,  3.50, NULL,   6,  10, true),
  ('SK', 'Eslovaquia',      22.00,  3.50, NULL,   6,  10, true),
  ('HU', 'Hungría',         22.00,  3.50, NULL,   6,  10, true),
  ('RO', 'Rumanía',         22.00,  3.50, NULL,   6,  10, true),
  ('BG', 'Bulgaria',        22.00,  3.50, NULL,   6,  10, true),
  ('HR', 'Croacia',         22.00,  3.50, NULL,   6,  10, true),
  ('SI', 'Eslovenia',       22.00,  3.50, NULL,   6,  10, true),

  -- Paises Balticos — sin envio gratis
  ('EE', 'Estonia',         28.00,  4.50, NULL,   7,  12, true),
  ('LV', 'Letonia',         28.00,  4.50, NULL,   7,  12, true),
  ('LT', 'Lituania',        28.00,  4.50, NULL,   7,  12, true),

  -- Islas — sin envio gratis
  ('IE', 'Irlanda',         30.00,  5.00, NULL,   8,  14, true),
  ('MT', 'Malta',           30.00,  5.00, NULL,   8,  14, true),
  ('CY', 'Chipre',          30.00,  5.00, NULL,   8,  14, true),
  ('GR', 'Grecia',          30.00,  5.00, NULL,   8,  14, true)

ON CONFLICT (country_code) DO UPDATE SET
  country_name            = EXCLUDED.country_name,
  base_cost               = EXCLUDED.base_cost,
  per_item_cost           = EXCLUDED.per_item_cost,
  free_shipping_threshold = EXCLUDED.free_shipping_threshold,
  delivery_days_min       = EXCLUDED.delivery_days_min,
  delivery_days_max       = EXCLUDED.delivery_days_max,
  is_active               = EXCLUDED.is_active,
  updated_at              = now();
