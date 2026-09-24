-- primary_image quedo a NULL en las 40 filas. La tienda no se rompe porque
-- getMainImage() cae a images[0] (src/utils/plantImageUtils.ts), pero depender
-- de un fallback para el caso normal es fragil: cualquier cambio en ese helper
-- deja el catalogo sin portada. Se fija explicitamente.

UPDATE public.plants
   SET primary_image = images[1]
 WHERE primary_image IS NULL
   AND images IS NOT NULL
   AND cardinality(images) > 0;
