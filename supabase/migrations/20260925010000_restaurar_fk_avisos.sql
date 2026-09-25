-- Restaura la clave ajena de stock_notifications.plant_id -> plants.id.
--
-- La solto la migracion 20260203211624 con este motivo: "This allows using
-- local plant slugs as IDs instead of database UUIDs". Ese motivo ya no aplica
-- -- el catalogo viene de la base y la ficha pasa el UUID real -- y ademas la
-- columna es de tipo UUID, asi que nunca pudo guardar un slug: el DROP no
-- habilito nada y solo quito integridad.
--
-- Sin la clave, cualquiera puede darse de alta para un plant_id inventado:
-- comprobado, un UUID de ceros entraba con 201. Esas filas no casan con ninguna
-- planta, asi que notify-restock nunca las encuentra y se acumulan en silencio.

-- Primero fuera lo huerfano, o el ALTER fallaria.
DELETE FROM public.stock_notifications sn
 WHERE NOT EXISTS (SELECT 1 FROM public.plants p WHERE p.id = sn.plant_id);

ALTER TABLE public.stock_notifications
  DROP CONSTRAINT IF EXISTS stock_notifications_plant_id_fkey;

ALTER TABLE public.stock_notifications
  ADD CONSTRAINT stock_notifications_plant_id_fkey
  FOREIGN KEY (plant_id) REFERENCES public.plants(id) ON DELETE CASCADE;

-- Restos de las comprobaciones de hoy.
DELETE FROM public.stock_notifications
 WHERE lower(email) IN ('fk.test@example.com','fk.control@example.com','x@example.com');
