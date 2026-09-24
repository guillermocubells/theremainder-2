-- Imagenes recuperadas. Solo 1 de las 40 plantas del catalogo tienen foto
-- en el repositorio: el rescate de imagenes y el del catalogo cubrieron conjuntos
-- de plantas casi disjuntos (12 y 40 entradas, 1 en comun).
-- Los ficheros se sirven estaticamente desde public/lovable-uploads: no hace
-- falta ningun bucket de Storage, y las imagenes viajan con el repositorio.

UPDATE public.plants
   SET images = ARRAY['/lovable-uploads/a04b7d73-9b68-4e31-9174-3d181aad491c.png', '/lovable-uploads/9b38e27d-78c3-4b53-a08a-b3441009766c.png', '/lovable-uploads/572c0131-eb0d-4fcf-9b74-8f1e4100f427.png', '/lovable-uploads/1e817628-12d6-4836-9977-07c3012a0df1.png']::text[],
       primary_image = '/lovable-uploads/a04b7d73-9b68-4e31-9174-3d181aad491c.png'
 WHERE slug = 'magnolia-laevifolia'
   AND (images IS NULL OR cardinality(images) = 0);

