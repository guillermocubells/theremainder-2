-- La migracion de imagenes originales sobrescribio las 13 fotos propias de
-- Geonoma undata (tomadas en Ecuador, servidas desde /plantas/) con las 5 URLs
-- externas del proyecto viejo. Se restauran las propias DELANTE: son suyas, se
-- sirven desde el propio dominio y no dependen de que un tercero las mantenga.
-- Las externas quedan detras como respaldo.

UPDATE public.plants
   SET images = ARRAY[
         '/plantas/geonoma-undata-1.jpg','/plantas/geonoma-undata-2.jpg',
         '/plantas/geonoma-undata-3.jpg','/plantas/geonoma-undata-4.jpg',
         '/plantas/geonoma-undata-5.jpg','/plantas/geonoma-undata-6.jpg',
         '/plantas/geonoma-undata-7.jpg','/plantas/geonoma-undata-8.jpg',
         '/plantas/geonoma-undata-9.jpg','/plantas/geonoma-undata-10.jpg',
         '/plantas/geonoma-undata-11.jpg','/plantas/geonoma-undata-12.jpg',
         '/plantas/geonoma-undata-13.jpg'
       ]::text[] || COALESCE(images, ARRAY[]::text[]),
       primary_image = '/plantas/geonoma-undata-1.jpg'
 WHERE slug = 'geonoma-undata'
   AND NOT ('/plantas/geonoma-undata-1.jpg' = ANY(COALESCE(images, ARRAY[]::text[])));

-- primary_image faltaba en varias filas que si tienen images.
UPDATE public.plants
   SET primary_image = images[1]
 WHERE primary_image IS NULL AND images IS NOT NULL AND cardinality(images) > 0;
