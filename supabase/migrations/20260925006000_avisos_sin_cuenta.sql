-- Avisos de disponibilidad sin necesidad de cuenta.
--
-- Hasta ahora stock_notifications exigia user_id NOT NULL y las politicas solo
-- dejaban insertar lo propio, asi que un visitante tenia que registrarse para
-- pedir que le avisaran. Eso vacia de sentido la pantalla de agotados: quien
-- llega buscando una especie rara no se crea una cuenta para dejar un correo.
--
-- Seguridad: los anonimos pueden ESCRIBIR pero no LEER. La politica de SELECT
-- existente exige is_own_stock_notification(user_id), que con user_id NULL
-- evalua a NULL y por tanto no concede acceso. Sin eso, la tabla seria una
-- lista de correos a disposicion de cualquiera.

ALTER TABLE public.stock_notifications ALTER COLUMN user_id DROP NOT NULL;

-- El UNIQUE(user_id, plant_id) original no sirve para anonimos: en Postgres dos
-- NULL no colisionan, asi que no impediria duplicados. Se anade un indice
-- parcial por correo para las filas sin cuenta.
CREATE UNIQUE INDEX IF NOT EXISTS stock_notifications_anon_uniq
  ON public.stock_notifications (plant_id, lower(email))
  WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Anyone can subscribe with an email" ON public.stock_notifications;
CREATE POLICY "Anyone can subscribe with an email"
  ON public.stock_notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND email IS NOT NULL
    AND length(email) BETWEEN 6 AND 254
    AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$'
  );
