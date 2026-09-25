import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ShippingForm {
  email: string;
  fullName: string;
  phone: string;
  street: string;
  apartment: string;
  postalCode: string;
  city: string;
  province: string;
  notes: string;
}

interface QuoteRequestPanelProps {
  items: CartItem[];
  shippingCountry: string;
  shippingForm: ShippingForm;
  shippingTotal?: number | null;
  referralCode?: string | null;
}

/**
 * Cierre de pedido sin pasarela de pago.
 *
 * Stripe no esta configurado, asi que el checkout no puede cobrar. En vez de
 * dejar la tienda sin forma de vender, el cliente confirma sus datos y el
 * pedido queda registrado; el dueno lo revisa y responde con el presupuesto y
 * la forma de pago. Es temporal.
 *
 * La solicitud se GUARDA en base de datos, no solo se envia por correo: el
 * envio depende de un servicio externo que hoy no esta configurado, y si solo
 * fuera un email cada pedido hecho mientras tanto se perderia sin rastro.
 * El correo se intenta despues, y su fallo no invalida el pedido.
 */
export const QuoteRequestPanel = ({
  items,
  shippingCountry,
  shippingForm,
  shippingTotal,
  referralCode,
}: QuoteRequestPanelProps) => {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const envio = shippingTotal ?? null;
  const total = itemsTotal + (envio ?? 0);

  const enviar = async () => {
    setEnviando(true);
    const snapshot = items.map((i) => ({
      id: i.id,
      nombre: i.name,
      unidades: i.quantity,
      precio_unitario: i.price,
      subtotal: Number((i.price * i.quantity).toFixed(2)),
    }));

    const { data, error } = await supabase
      .from("quote_requests")
      .insert({
        user_id: user?.id ?? null,
        email: shippingForm.email.trim(),
        full_name: shippingForm.fullName.trim(),
        phone: shippingForm.phone || null,
        street: shippingForm.street || null,
        apartment: shippingForm.apartment || null,
        postal_code: shippingForm.postalCode || null,
        city: shippingForm.city || null,
        province: shippingForm.province || null,
        country: shippingCountry || null,
        notes: shippingForm.notes || null,
        items: snapshot,
        items_total: Number(itemsTotal.toFixed(2)),
        shipping_total: envio,
        grand_total: Number(total.toFixed(2)),
        referral_code: referralCode ?? null,
      })
      .select("id")
      .single();

    if (error) {
      setEnviando(false);
      toast.error("No se ha podido enviar la solicitud. Inténtalo de nuevo.");
      return;
    }

    // El aviso por correo es best-effort: si el servicio de envio no esta
    // configurado, la solicitud ya esta guardada y no se pierde.
    try {
      await supabase.functions.invoke("send-quote-request", { body: { id: data.id } });
    } catch {
      /* el pedido ya consta; el dueno lo vera en el panel */
    }

    setEnviando(false);
    setHecho(true);
    clearCart();
  };

  if (hecho) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-6" role="status">
        <div className="mb-3 flex items-center gap-2">
          <Check className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">Solicitud enviada</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Hemos recibido tu pedido. Te escribiremos a{" "}
          <strong className="text-foreground">{shippingForm.email}</strong> con el presupuesto
          final, los gastos de envío y la forma de pago. No se te ha cobrado nada.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div className="text-sm">
          <p className="mb-1 font-medium text-foreground">Pago aún no disponible en la web</p>
          <p className="text-muted-foreground">
            Estamos terminando de configurar la pasarela. Envía tu pedido y te responderemos por
            correo con el presupuesto y la forma de pago. <strong>No se te cobrará nada ahora.</strong>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Resumen de tu pedido</h4>
        <ul className="mb-3 space-y-1.5 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {i.quantity} × {i.name}
              </span>
              <span className="shrink-0 tabular-nums">{(i.price * i.quantity).toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Productos</span>
            <span className="tabular-nums">{itemsTotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Envío</span>
            <span className="tabular-nums">
              {envio === null ? "a confirmar" : `${envio.toFixed(2)} €`}
            </span>
          </div>
          <div className="flex justify-between pt-1 font-semibold text-foreground">
            <span>Total estimado</span>
            <span className="tabular-nums">{total.toFixed(2)} €</span>
          </div>
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Se enviará a nombre de <strong className="text-foreground">{shippingForm.fullName}</strong>
          {shippingForm.city ? `, ${shippingForm.city}` : ""} ({shippingCountry}). Te contactaremos
          en <strong className="text-foreground">{shippingForm.email}</strong>.
        </p>
      </div>

      <Button onClick={enviar} disabled={enviando} size="lg" className="w-full gap-2">
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{enviando ? "Enviando…" : "Enviar pedido y recibir presupuesto"}</span>
      </Button>
    </div>
  );
};

export default QuoteRequestPanel;
