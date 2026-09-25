-- Solicitudes de pedido sin pasarela de pago.
--
-- Stripe no esta configurado (faltan STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET),
-- asi que el checkout no puede cobrar. En vez de dejar la tienda sin forma de
-- vender, el cliente deja sus datos y el pedido queda registrado aqui para que
-- el dueno lo gestione a mano. Es temporal, hasta que la pasarela funcione.
--
-- Se guarda en base de datos ADEMAS de enviarse por correo a proposito: el
-- envio depende de RESEND_API_KEY, que hoy tampoco esta puesta. Si solo fuera
-- un email, cada pedido hecho mientras tanto se perderia sin dejar rastro.

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'pendiente',
  user_id       uuid,
  email         text NOT NULL,
  full_name     text NOT NULL,
  phone         text,
  street        text,
  apartment     text,
  postal_code   text,
  city          text,
  province      text,
  country       text,
  notes         text,
  items         jsonb NOT NULL,
  items_total   numeric(10,2) NOT NULL DEFAULT 0,
  shipping_total numeric(10,2),
  grand_total   numeric(10,2),
  currency      text NOT NULL DEFAULT 'EUR',
  referral_code text,
  emailed_at    timestamptz,
  CONSTRAINT quote_requests_status_chk CHECK (status IN ('pendiente','contactado','cerrado','cancelado')),
  CONSTRAINT quote_requests_email_chk  CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$'),
  CONSTRAINT quote_requests_items_chk  CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0)
);

CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON public.quote_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx  ON public.quote_requests (status);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede enviar una solicitud...
DROP POLICY IF EXISTS "Anyone can request a quote" ON public.quote_requests;
CREATE POLICY "Anyone can request a quote"
  ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(full_name) BETWEEN 2 AND 120
    AND length(email) BETWEEN 6 AND 254
    AND jsonb_array_length(items) BETWEEN 1 AND 100
  );

-- ...pero NADIE puede leerlas salvo quien gestiona pedidos. Sin esto, la tabla
-- seria un listado publico de nombres, telefonos y direcciones de clientes.
DROP POLICY IF EXISTS "Order managers can read quotes" ON public.quote_requests;
CREATE POLICY "Order managers can read quotes"
  ON public.quote_requests FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'orders.view'));

DROP POLICY IF EXISTS "Order managers can update quotes" ON public.quote_requests;
CREATE POLICY "Order managers can update quotes"
  ON public.quote_requests FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'orders.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'orders.manage'));
