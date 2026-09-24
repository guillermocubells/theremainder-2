-- care_instructions y curious_facts quedaron como CADENAS jsonb con los valores
-- separados por "|", en vez de como arrays. La ficha de producto llama .map()
-- sobre curious_facts (PlantCuriousFacts.tsx:17) y lanza
-- "TypeError: e.map is not a function", dejando la pagina en blanco.
--
-- Origen del fallo: el generador de la semilla aplicaba el separado por "|" a
-- las columnas de tipo array, pero a las jsonb las envolvia como cadena JSON.
--
-- Idempotente: solo toca las filas cuyo valor sigue siendo una cadena.

UPDATE public.plants
   SET curious_facts = to_jsonb(string_to_array(curious_facts #>> '{}', '|'))
 WHERE jsonb_typeof(curious_facts) = 'string';

UPDATE public.plants
   SET care_instructions = to_jsonb(string_to_array(care_instructions #>> '{}', '|'))
 WHERE jsonb_typeof(care_instructions) = 'string';
