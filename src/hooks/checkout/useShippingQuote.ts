import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";

export interface ShippingQuote {
  supported: boolean;
  subtotalCents: number;
  shippingCostCents: number;
  totalCents: number;
  totalWeightGrams: number;
  isFreeShipping: boolean;
  amountForFreeShippingCents: number | null;
  freeShippingThresholdCents: number | null;
  shippingBaseCostCents?: number;
  shippingPerItemCostCents?: number;
  shippingItemCount?: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  zoneName: string;
  // Tax breakdown
  vatRate?: number;
  baseImponibleCents?: number;
  taxAmountCents?: number;
  countryCode?: string;
}

interface UseShippingQuoteOptions {
  items: CartItem[];
  countryCode: string | null;
}

export function useShippingQuote({ items, countryCode }: UseShippingQuoteOptions) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!countryCode || items.length === 0) {
      setQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cartItems = items.map((item) => ({
        plantId: item.plantId,
        quantity: item.quantity,
      }));

      const { data, error: fnError } = await supabase.functions.invoke(
        "calculate-shipping",
        {
          body: { items: cartItems, countryCode },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || "Failed to calculate shipping");
      }

      // La funcion devuelve el error como objeto ({ code, message, request_id }),
      // no como cadena. Comparar el objeto con la cadena daba siempre distinto,
      // asi que el caso "no enviamos a ese pais" acababa en el throw de abajo y
      // el usuario veia "[object Object]" con el boton Continuar bloqueado.
      if (data.error) {
        const code = typeof data.error === "string" ? data.error : data.error.code;
        if (code !== "SHIPPING_NOT_AVAILABLE") {
          const message =
            typeof data.error === "string"
              ? data.error
              : data.error.message || "Failed to calculate shipping";
          throw new Error(message);
        }
      }

      setQuote(data);
    } catch (err) {
      console.error("Shipping quote error:", err);
      setError(err instanceof Error ? err.message : "Error calculating shipping");
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [items, countryCode]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, isLoading, error, refetch: fetchQuote };
}
