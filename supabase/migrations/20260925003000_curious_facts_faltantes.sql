-- curious_facts estaba vacio en 5 plantas -- las ultimas que se anadieron al
-- catalogo original, que nunca llegaron a escribirse. Las otras 34 si los
-- tienen, de ahi el "creo recordar que habia de cada una".
--
-- Cada frase se DERIVA de la descripcion, el habitat o las notas que la propia
-- fila ya traia del proyecto original. No se inventa nada botanico, y se
-- respeta el formato de las existentes: 2-3 frases muy cortas.
--
--   Butia yatay        <- "hojas de un color verde glauco o azulado";
--                         "racimos de frutos comestibles de sabor agridulce,
--                          muy utilizados localmente para jaleas y licores";
--                         habitat: "comunidades densas llamadas palmares"
--   Prestoea acuminata <- "originaria de las selvas nubladas";
--                         notas: "menos comun en cultivo que la var. montana"
--   Syagrus romanzof.  <- "conocida como Palmera Pindo o Coco Plumoso";
--                         notas: "muy comun en paisajismo"
--
-- Sabal casuarium se queda SIN facts a proposito: no tiene descripcion ni
-- habitat en el volcado original, asi que no hay de donde derivarlos sin
-- inventarlos. La ficha ya oculta la seccion cuando esta vacia.

UPDATE public.plants SET curious_facts = to_jsonb(ARRAY[
  'Hojas azuladas', 'Frutos comestibles', 'Forma palmares'
]) WHERE slug = 'butia-yatay' AND COALESCE(jsonb_array_length(curious_facts), 0) = 0;

UPDATE public.plants SET curious_facts = to_jsonb(ARRAY[
  'Palmera de selva nublada', 'Poco comun en cultivo'
]) WHERE slug = 'prestoea-acuminata-var-acuminata' AND COALESCE(jsonb_array_length(curious_facts), 0) = 0;

UPDATE public.plants SET curious_facts = to_jsonb(ARRAY[
  'Coco plumoso', 'Muy usada en paisajismo'
]) WHERE slug = 'syagrus-romanzoffiana' AND COALESCE(jsonb_array_length(curious_facts), 0) = 0;
