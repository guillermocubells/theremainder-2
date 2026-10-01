/**
 * Proveedor de IA, configurable.
 *
 * Las dos funciones que usan IA —`recommend-plants` (el recomendador del
 * catalogo) y `ai-plant-autocomplete` (el alta de plantas del admin)— llamaban
 * en duro a `https://ai.gateway.lovable.dev` con `LOVABLE_API_KEY`, una
 * credencial del workspace de Lovable que murio con la cuenta. Las dos
 * devolvian 500 en produccion sin ninguna alternativa.
 *
 * La pasarela de Lovable hablaba el dialecto de la API de OpenAI, asi que
 * cualquier proveedor compatible sirve cambiando host, clave y modelo:
 * OpenRouter, Google AI Studio, OpenAI, Groq... Esto lee esos tres valores del
 * entorno en vez de clavarlos en el codigo.
 *
 * Variables (secretos de las edge functions):
 *   AI_API_KEY    clave del proveedor          (obligatoria)
 *   AI_BASE_URL   raiz compatible con OpenAI   (por defecto OpenRouter)
 *   AI_MODEL      identificador del modelo     (por defecto gemini-2.5-flash)
 *
 * Compatibilidad: si no hay `AI_API_KEY` pero si `LOVABLE_API_KEY`, se usa esa
 * contra la pasarela antigua, para no romper un despliegue que aun la tenga.
 */

export interface ConfiguracionIA {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const BASE_POR_DEFECTO = "https://openrouter.ai/api/v1";
const MODELO_POR_DEFECTO = "google/gemini-2.5-flash";
const BASE_LOVABLE = "https://ai.gateway.lovable.dev/v1";

/**
 * Devuelve la configuracion, o `null` si no hay ninguna clave. `null` NO es un
 * error del servidor: significa "esta funcion no esta disponible", y quien
 * llame debe responder 503 con un codigo que el front pueda interpretar para
 * esconder el boton, en vez de reventar con un 500.
 */
export function leerConfiguracionIA(): ConfiguracionIA | null {
  const propia = Deno.env.get("AI_API_KEY");
  if (propia) {
    return {
      apiKey: propia,
      baseUrl: (Deno.env.get("AI_BASE_URL") || BASE_POR_DEFECTO).replace(/\/+$/, ""),
      model: Deno.env.get("AI_MODEL") || MODELO_POR_DEFECTO,
    };
  }

  const heredada = Deno.env.get("LOVABLE_API_KEY");
  if (heredada) {
    return {
      apiKey: heredada,
      baseUrl: BASE_LOVABLE,
      model: Deno.env.get("AI_MODEL") || MODELO_POR_DEFECTO,
    };
  }

  return null;
}

/** Respuesta estandar cuando no hay proveedor configurado. */
export function respuestaIANoDisponible(cabeceras: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "AI_NOT_CONFIGURED",
      message:
        "El asistente de IA no está disponible: falta configurar AI_API_KEY en los secretos de las edge functions.",
    }),
    { headers: { ...cabeceras, "Content-Type": "application/json" }, status: 503 },
  );
}

/** POST a `/chat/completions` del proveedor configurado. */
export function llamarChat(
  cfg: ConfiguracionIA,
  cuerpo: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({ model: cfg.model, ...cuerpo }),
  });
}
