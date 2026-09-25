-- Limpieza de las filas usadas para comprobar que un visitante anonimo puede
-- enviar una solicitud de pedido y pedir aviso de stock. Los anonimos no pueden
-- borrar -- que es lo que se buscaba -- asi que se hace desde aqui.
--
-- Nota para el futuro: el primer intento de alta en quote_requests devolvio 401
-- y parecia un fallo de permisos. No lo era: PostgREST cachea el esquema y
-- tarda en ver una tabla recien creada. Conviene reintentar antes de diagnosticar.

DELETE FROM public.quote_requests
 WHERE lower(email) IN ('x@example.com', 'cliente.prueba@example.com');

DELETE FROM public.stock_notifications
 WHERE lower(email) IN ('x@example.com', 'prueba.anonima@example.com');
