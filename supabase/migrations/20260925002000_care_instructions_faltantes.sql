-- Cuatro plantas se recuperaron del proyecto original con care_instructions y
-- curious_facts vacios ('{}' y '[]'), asi que su ficha pintaba los titulos
-- "Care Instructions" y "Curious Facts" sin nada debajo. Un titulo huerfano se
-- lee como algo roto, no como algo que falta.
--
-- Las instrucciones se DERIVAN de los campos estructurados que la propia fila ya
-- tiene -- exposicion, riego, humedad, ritmo y temperatura minima -- para no
-- inventar datos de cultivo. Prestoea no se toca: no tiene ninguno de esos
-- campos, y la ficha ahora oculta la seccion en vez de dejar el hueco.

UPDATE public.plants SET care_instructions = to_jsonb(ARRAY[
  'Pleno sol',
  'Riego escaso: tolera bien la sequia',
  'Ambiente seco, sin exceso de humedad',
  'Crecimiento lento: no forzar con abonado',
  'Resiste hasta -10 °C una vez establecida'
]) WHERE slug = 'butia-yatay' AND jsonb_typeof(care_instructions) <> 'array';

UPDATE public.plants SET care_instructions = to_jsonb(ARRAY[
  'Pleno sol',
  'Riego moderado y regular',
  'Humedad ambiental media',
  'Crecimiento lento: no forzar con abonado',
  'Resiste hasta -7 °C una vez establecida'
]) WHERE slug = 'sabal-casuarium' AND jsonb_typeof(care_instructions) <> 'array';

UPDATE public.plants SET care_instructions = to_jsonb(ARRAY[
  'Sol directo o semisombra',
  'Riego moderado y regular',
  'Humedad ambiental media',
  'Crecimiento rapido: necesita espacio',
  'Resiste hasta -7 °C una vez establecida'
]) WHERE slug = 'syagrus-romanzoffiana' AND jsonb_typeof(care_instructions) <> 'array';

-- curious_facts se deja vacio a proposito en las cuatro: no hay dato de origen
-- del que derivarlos sin inventarlos, y la ficha ya oculta la seccion.
