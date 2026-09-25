-- Inventario real declarado por el dueno el 25-sep-2026. Solo quedan
-- existencias de diez especies; el resto pasa a 0 unidades y la ficha las
-- marca como agotadas.
--
-- Los nombres llegaron dictados y deformados; el emparejamiento se resolvio por
-- similitud contra el catalogo, verificando que la segunda opcion quedara muy
-- por detras en todos los casos:
--   "Borreeotiquientia japala" -> Burretiokentia hapala   (74% frente a 40%)
--   "Ceratophyllum hilde"      -> Ceratozamia hildae      (65% frente a 35%)
--   "Tracaina draco"           -> Dracaena draco          (88%)
--   "Dictyocaryum laevisianum" -> Dictyocaryum lamarckianum (79%)
--
-- Se pone a 0 el stock, NO se desactivan: la ficha sigue visible con el aviso
-- de agotado y el boton de avisar cuando vuelva a haber. Desactivarlas las
-- sacaria del catalogo y se perderia ese interes.

UPDATE public.plants SET stock_qty = 0
 WHERE slug NOT IN ('araucaria-angustifolia', 'burretiokentia-hapala', 'ceratozamia-hildae', 'chamaedorea-elegans-negrita', 'dictyocaryum-lamarckianum', 'ixora-margaretae', 'dracaena-draco-madeira', 'rhopalostylis-sapida-var-oceana', 'sabal-miamiensis', 'magnolia-grandiflora')
   AND stock_qty <> 0;
