// Avisa al dueno por correo de una nueva solicitud de pedido.
//
// La solicitud YA esta guardada en quote_requests cuando esta funcion se
// invoca. El correo es un aviso, no el registro: si RESEND_API_KEY no esta
// configurada, se devuelve 200 con enviado:false y el pedido sigue constando
// en el panel. Un fallo aqui nunca debe hacer creer al cliente que su pedido
// no ha entrado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const DESTINO = "guillermocubells@gmail.com";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { id } = await req.json();
    if (!id) return json({ error: "falta id" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: q, error } = await supabase
      .from("quote_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !q) return json({ error: "solicitud no encontrada" }, 404);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      // No es un error: es el estado esperado hasta que se configure el envio.
      return json({ enviado: false, motivo: "RESEND_API_KEY sin configurar", id });
    }

    const lineas = (q.items as Array<Record<string, unknown>>)
      .map(
        (i) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(i.unidades)} × ${esc(
            i.nombre
          )}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${esc(
            i.subtotal
          )} €</td></tr>`
      )
      .join("");

    const direccion = [q.street, q.apartment, q.postal_code, q.city, q.province, q.country]
      .filter(Boolean)
      .map(esc)
      .join(", ");

    const html = `
      <h2 style="margin:0 0 4px">Nuevo pedido — ${esc(q.grand_total)} €</h2>
      <p style="margin:0 0 16px;color:#666">Pago no cobrado. Hay que responder con presupuesto y forma de pago.</p>
      <h3 style="margin:16px 0 6px">Cliente</h3>
      <p style="margin:0;line-height:1.6">
        <strong>${esc(q.full_name)}</strong><br>
        ${esc(q.email)}${q.phone ? ` · ${esc(q.phone)}` : ""}<br>
        ${direccion || "<em>sin direccion</em>"}
      </p>
      ${q.notes ? `<h3 style="margin:16px 0 6px">Notas</h3><p style="margin:0">${esc(q.notes)}</p>` : ""}
      <h3 style="margin:16px 0 6px">Pedido</h3>
      <table style="border-collapse:collapse;width:100%;max-width:520px">${lineas}
        <tr><td style="padding:6px 10px">Envio</td><td style="padding:6px 10px;text-align:right">${
          q.shipping_total == null ? "a confirmar" : `${esc(q.shipping_total)} €`
        }</td></tr>
        <tr><td style="padding:6px 10px;font-weight:700">Total</td><td style="padding:6px 10px;text-align:right;font-weight:700">${esc(
          q.grand_total
        )} €</td></tr>
      </table>
      <p style="margin:20px 0 0;color:#888;font-size:12px">Solicitud ${esc(q.id)}</p>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Remainder <onboarding@resend.dev>",
        to: [DESTINO],
        reply_to: q.email,
        subject: `Nuevo pedido — ${q.full_name} — ${q.grand_total} €`,
        html,
      }),
    });

    if (!r.ok) {
      return json({ enviado: false, motivo: `resend ${r.status}`, id });
    }

    await supabase
      .from("quote_requests")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", id);

    return json({ enviado: true, id });
  } catch (e) {
    // Nunca se propaga como fallo al cliente: el pedido ya esta guardado.
    return json({ enviado: false, motivo: String((e as Error).message ?? e) });
  }
});
