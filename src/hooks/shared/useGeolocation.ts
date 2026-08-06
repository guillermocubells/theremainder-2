import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

export type GeoPermission = "prompt" | "granted" | "denied" | "unavailable";

export interface GeoLocationResult {
  postalCode: string;
  city: string;
  region: string;
  country: string;
}

interface UseGeolocationResult {
  requestLocation: () => Promise<GeoLocationResult | null>;
  loading: boolean;
  error: string | null;
  permission: GeoPermission;
}

// ── Reverse geocode via Nominatim (free, no API key) ─────────────────
async function reverseGeocode(lat: number, lon: number): Promise<GeoLocationResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=es`,
      { headers: { "User-Agent": "FrondaPrima/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    return {
      postalCode: addr.postcode || "",
      city: addr.city || addr.town || addr.village || addr.municipality || "",
      region: addr.state || addr.county || "",
      country: addr.country_code?.toUpperCase() || "",
    };
  } catch {
    return null;
  }
}

// ── IP-based fallback via ipapi (free tier, no key) ──────────────────
export async function ipFallbackLocation(): Promise<GeoLocationResult | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      postalCode: data.postal || "",
      city: data.city || "",
      region: data.region || "",
      country: data.country_code || "",
    };
  } catch {
    return null;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useGeolocation(): UseGeolocationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<GeoPermission>("prompt");

  const isGeoAvailable = typeof navigator !== "undefined" && "geolocation" in navigator;

  // Check permission state on mount
  useEffect(() => {
    if (!isGeoAvailable) {
      setPermission("unavailable");
      return;
    }
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      setPermission(result.state as GeoPermission);
      result.addEventListener("change", () => {
        setPermission(result.state as GeoPermission);
      });
    }).catch(() => {
      // permissions API not available, stay at "prompt"
    });
  }, [isGeoAvailable]);

  const requestLocation = useCallback(async (): Promise<GeoLocationResult | null> => {
    if (!isGeoAvailable) {
      setError("La geolocalización no está disponible en este navegador");
      return null;
    }
    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 min cache
        });
      });

      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (geo?.postalCode) {
        return geo;
      }

      // Fallback to IP if reverse geocode fails
      const ipGeo = await ipFallbackLocation();
      if (ipGeo?.postalCode) {
        return ipGeo;
      }

      setError("No se pudo determinar tu ubicación. Introduce un código postal manualmente.");
      return null;
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr.code === geoErr.PERMISSION_DENIED) {
        setPermission("denied");
        setError("Permiso de ubicación denegado. Puedes introducir tu código postal manualmente.");
      } else if (geoErr.code === geoErr.TIMEOUT) {
        setError("La solicitud de ubicación ha expirado. Inténtalo de nuevo o introduce un código postal.");
      } else {
        setError("Error al obtener tu ubicación. Introduce un código postal manualmente.");
      }

      // Try IP fallback on error
      const ipGeo = await ipFallbackLocation();
      if (ipGeo?.postalCode) {
        return ipGeo;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [isGeoAvailable]);

  return {
    requestLocation,
    loading,
    error,
    permission,
  };
}
