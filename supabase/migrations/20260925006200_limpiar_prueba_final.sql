-- La limpieza anterior funciono, pero la comprobacion que hice despues -- un
-- alta para ver si el hueco se habia liberado -- volvio a crear la fila. Es el
-- riesgo de verificar con una escritura en vez de con una lectura.
DELETE FROM public.stock_notifications WHERE lower(email) = 'prueba.anonima@example.com';
