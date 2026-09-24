-- Dos plantas que el volcado de rescate perdio y que SI estaban vivas en la
-- tienda. Se detectaron comparando el catalogo recuperado contra una consulta
-- al API del proyecto viejo hecha el 23-sep, antes de que se pausara:
--   prestoea-acuminata-var-acuminata  150 EUR   <- la mas cara del catalogo
--   geonoma-undata                    100 EUR
-- Ninguna de las dos esta entre las 40 del volcado. El recuento cuadraba (40
-- frente a 39 servidas), asi que la perdida fue invisible: cambio la
-- composicion, no el tamano.
--
-- Geonoma undata entra ACTIVA: hay 13 fotos propias y los datos de
-- cultivo se transcriben de la captura de su ficha en produccion.
--
-- Prestoea entra INACTIVA a proposito: de ella solo se conocen el nombre
-- cientifico y el precio. Publicar una ficha sin descripcion ni foto en una
-- tienda abierta es peor que no publicarla. Queda lista para completar desde
-- el panel y activar.

INSERT INTO public.plants (
  name, scientific_name, common_name, slug, price, stock_qty, is_active, is_featured,
  plant_type, family, short_description, description,
  exposure, water, humidity, growth_rate, climate_zones, hardiness_zones,
  container_size, care_instructions, curious_facts, images, primary_image, display_order
) VALUES (
  'Geonoma undata', 'Geonoma undata', 'Palma de montaña',
  'geonoma-undata', 100, 0, TRUE, FALSE,
  'palm', 'Arecaceae',
  'Exclusiva palmera de selva nublada con hojas anchas y onduladas, ideal para climas frescos y húmedos.',
  'Exclusiva palmera de selva nublada con hojas anchas y onduladas, ideal para climas frescos y húmedos.',
  ARRAY['semisol']::text[], 'high', 'high', 'Lento',
  ARRAY['tropical','subtropical','oceanico']::text[], ARRAY['10a','10b','11a']::text[],
  '15-25 cm (maceta profunda)',
  '["Semisombra","Humedad alta","Riego frecuente","Crecimiento lento"]'::jsonb,
  '["Palmera de selva nublada andina","Hojas anchas y onduladas"]'::jsonb,
  ARRAY['/plantas/geonoma-undata-1.jpg','/plantas/geonoma-undata-2.jpg','/plantas/geonoma-undata-3.jpg','/plantas/geonoma-undata-4.jpg','/plantas/geonoma-undata-5.jpg','/plantas/geonoma-undata-6.jpg','/plantas/geonoma-undata-7.jpg','/plantas/geonoma-undata-8.jpg','/plantas/geonoma-undata-9.jpg','/plantas/geonoma-undata-10.jpg','/plantas/geonoma-undata-11.jpg','/plantas/geonoma-undata-12.jpg','/plantas/geonoma-undata-13.jpg']::text[], '/plantas/geonoma-undata-1.jpg', 200
)
ON CONFLICT (slug) DO UPDATE SET
  images = EXCLUDED.images, primary_image = EXCLUDED.primary_image, price = EXCLUDED.price;

INSERT INTO public.plants (
  name, scientific_name, slug, price, stock_qty, is_active, plant_type, family, display_order
) VALUES (
  'Prestoea acuminata var. acuminata', 'Prestoea acuminata var. acuminata',
  'prestoea-acuminata-var-acuminata', 150, 0, FALSE, 'palm', 'Arecaceae', 201
)
ON CONFLICT (slug) DO NOTHING;

-- Categoria, igual que hace la semilla: derivada de plant_type.
UPDATE public.plants p SET category_id = c.id
  FROM public.categories c
 WHERE p.category_id IS NULL AND p.plant_type::text = 'palm' AND c.slug = 'palmeras';
