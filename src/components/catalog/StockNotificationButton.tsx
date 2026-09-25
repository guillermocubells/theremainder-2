import { useState } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStockNotification } from "@/hooks/checkout";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface StockNotificationButtonProps {
  plantId: string;
  className?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

/**
 * Aviso de disponibilidad.
 *
 * Con sesion iniciada funciona como antes: un boton que se suscribe con el
 * correo de la cuenta. Sin sesion se pide el correo aqui mismo, en vez de
 * mandar a /auth: quien llega buscando una especie agotada no se crea una
 * cuenta para dejar un email, y ese era el unico camino que habia.
 *
 * Las filas anonimas van con user_id NULL. La politica de RLS deja insertarlas
 * pero NO leerlas, asi que la lista de correos no queda expuesta.
 */
const StockNotificationButton = ({ plantId, className = "" }: StockNotificationButtonProps) => {
  const { t } = useTranslation();
  const { isSubscribed, isLoading, subscribe, unsubscribe, isAuthenticated } =
    useStockNotification(plantId);

  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const handleAuthClick = async () => {
    if (isSubscribed) await unsubscribe();
    else await subscribe();
  };

  const handleAnonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = email.trim();
    if (!EMAIL_RE.test(valor)) {
      toast.error(t("stockNotification.invalidEmail", "Introduce un correo válido"));
      return;
    }
    setEnviando(true);
    const { error } = await supabase
      .from("stock_notifications")
      .insert({ plant_id: plantId, email: valor });
    setEnviando(false);

    // 23505 = clave duplicada. Ya estaba apuntado: para el visitante el
    // resultado es el mismo, asi que no tiene sentido mostrarlo como fallo.
    if (error && error.code !== "23505") {
      toast.error(t("stockNotification.error"));
      return;
    }
    setHecho(true);
    toast.success(t("stockNotification.subscribed"));
  };

  if (isAuthenticated) {
    return (
      <Button
        variant={isSubscribed ? "secondary" : "default"}
        onClick={handleAuthClick}
        disabled={isLoading}
        size="lg"
        className={`gap-2 text-sm sm:text-base px-6 sm:px-8 ${isSubscribed ? "" : "bg-danger hover:bg-danger/90 text-danger-foreground"} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
        ) : isSubscribed ? (
          <BellOff className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
        <span>
          {isSubscribed ? t("stockNotification.cancelNotification") : t("stockNotification.notifyMe")}
        </span>
      </Button>
    );
  }

  if (hecho) {
    return (
      <p className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`} role="status">
        <Check className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
        {t("stockNotification.subscribed")}
      </p>
    );
  }

  return (
    <form onSubmit={handleAnonSubmit} className={`w-full ${className}`}>
      <label htmlFor={`aviso-${plantId}`} className="mb-2 block text-sm text-muted-foreground">
        {t("stockNotification.notifyMe")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`aviso-${plantId}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("stockNotification.emailPlaceholder", "tu@correo.com")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={enviando}
          className="sm:flex-1"
        />
        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="gap-2 bg-danger px-6 text-danger-foreground hover:bg-danger/90 sm:px-8"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bell className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{t("stockNotification.notifyMeShort", "Avísame")}</span>
        </Button>
      </div>
    </form>
  );
};

export default StockNotificationButton;
