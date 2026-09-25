-- Restos de la verificacion de la clave ajena restaurada.
DELETE FROM public.stock_notifications
 WHERE lower(email) IN ('fk.verif@example.com','fk.verif2@example.com');
