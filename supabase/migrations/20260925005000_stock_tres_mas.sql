-- Correccion del inventario del 25-sep: el dueno tambien conserva Phoenix
-- canariensis y Phormium cookianum, que la pasada anterior puso a 0.
-- Dictyocaryum lamarckianum ya figuraba entre las diez, con 1 unidad.
--
-- Se restauran las cantidades que tenian justo antes de aquel cambio (3 y 10),
-- no una cifra inventada.

UPDATE public.plants SET stock_qty = 3  WHERE slug = 'phoenix-canariensis' AND stock_qty = 0;
UPDATE public.plants SET stock_qty = 10 WHERE slug = 'phormium-cookianum'  AND stock_qty = 0;
