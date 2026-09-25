-- Trachycarpus princeps "Stone Gate" tambien queda disponible: 1 unidad.
UPDATE public.plants SET stock_qty = 1
 WHERE slug = 'trachycarpus-princeps-stone-gate' AND stock_qty = 0;
