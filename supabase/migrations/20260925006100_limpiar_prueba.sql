-- Borra la suscripcion de prueba usada para verificar que un anonimo puede
-- darse de alta (201), que un correo malformado se rechaza (401), que no puede
-- leer la lista ([]) y que el duplicado choca (409). Los anonimos no pueden
-- borrar -- que es justo lo que se queria -- asi que hay que hacerlo desde aqui.
DELETE FROM public.stock_notifications WHERE lower(email) = 'prueba.anonima@example.com';
