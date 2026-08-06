import { useState, useEffect, useCallback, useRef } from "react";
import { analyzePostalCodeClimate, ClimateInfo } from "@/utils/viabilityCalculator";
import { useGeolocation, ipFallbackLocation } from "./useGeolocation";

// ── Types ────────────────────────────────────────────────────────────

export type LocationSource = "geolocation" | "manual" | "ip" | "saved_address" | "none";
export type { GeoPermission } from "./useGeolocation";

export interface LocationPreference {
  postalCode: string;
  city: string;
  region: string;
  country: string;
  source: LocationSource;
  climate: ClimateInfo | null;
  addressId: string | null;
  updatedAt: number;
}

interface UseLocationPreferenceResult {
  location: LocationPreference | null;
  permission: import("./useGeolocation").GeoPermission;
  loading: boolean;
  error: string | null;
  /** Try browser geolocation → reverse geocode → extract postal code */
  requestGeolocation: () => Promise<void>;
  /** Set location manually from postal code */
  setManualPostalCode: (postalCode: string) => void;
  /** Set location from a saved user address */
  setFromAddress: (address: { id: string; postal_code: string; city: string; province: string; country: string }) => void;
  /** Clear stored location */
  clearLocation: () => void;
  /** Check if geolocation API is available */
  isGeoAvailable: boolean;
}

// ── Storage key ──────────────────────────────────────────────────────
const STORAGE_KEY = "fp_location_pref";

function loadStored(): LocationPreference | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationPreference;
    // Expire after 30 days
    if (Date.now() - parsed.updatedAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(pref: LocationPreference) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    // quota exceeded, ignore
  }
}

// ── Postal code → region name mapping (for manual input) ─────────────
function postalCodeToRegionLabel(code: string): string {
  const num = parseInt(code.replace(/\D/g, ""), 10);
  if (isNaN(num)) return "";

  // Spanish codes
  if (num >= 1000 && num <= 52999) {
    const province = Math.floor(num / 1000);
    const map: Record<number, string> = {
      1: "Álava", 2: "Albacete", 3: "Alicante", 4: "Almería", 5: "Ávila",
      6: "Badajoz", 7: "Baleares", 8: "Barcelona", 9: "Burgos", 10: "Cáceres",
      11: "Cádiz", 12: "Castellón", 13: "Ciudad Real", 14: "Córdoba", 15: "A Coruña",
      16: "Cuenca", 17: "Girona", 18: "Granada", 19: "Guadalajara", 20: "Gipuzkoa",
      21: "Huelva", 22: "Huesca", 23: "Jaén", 24: "León", 25: "Lleida",
      26: "La Rioja", 27: "Lugo", 28: "Madrid", 29: "Málaga", 30: "Murcia",
      31: "Navarra", 32: "Ourense", 33: "Asturias", 34: "Palencia", 35: "Las Palmas",
      36: "Pontevedra", 37: "Salamanca", 38: "S/C Tenerife", 39: "Cantabria",
      40: "Segovia", 41: "Sevilla", 42: "Soria", 43: "Tarragona", 44: "Teruel",
      45: "Toledo", 46: "Valencia", 47: "Valladolid", 48: "Bizkaia", 49: "Zamora",
      50: "Zaragoza", 51: "Ceuta", 52: "Melilla",
    };
    return map[province] || "";
  }
  return "";
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useLocationPreference(): UseLocationPreferenceResult {
  const [location, setLocation] = useState<LocationPreference | null>(loadStored);
  const [localError, setLocalError] = useState<string | null>(null);
  const ipFetchedRef = useRef(false);

  const geo = useGeolocation();

  const isGeoAvailable = typeof navigator !== "undefined" && "geolocation" in navigator;

  // IP fallback on mount if no stored location
  useEffect(() => {
    if (location || ipFetchedRef.current) return;
    ipFetchedRef.current = true;

    ipFallbackLocation().then((result) => {
      if (!result || !result.postalCode) return;
      const climate = analyzePostalCodeClimate(result.postalCode);
      const pref: LocationPreference = {
        postalCode: result.postalCode,
        city: result.city,
        region: result.region,
        country: result.country,
        source: "ip",
        climate,
        addressId: null,
        updatedAt: Date.now(),
      };
      setLocation(pref);
      // Don't persist IP-based — ephemeral until user confirms
    });
  }, [location]);

  const applyLocation = useCallback(
    (
      postalCode: string,
      city: string,
      region: string,
      country: string,
      source: LocationSource,
      addressId: string | null = null
    ) => {
      const climate = postalCode ? analyzePostalCodeClimate(postalCode) : null;
      const pref: LocationPreference = {
        postalCode,
        city,
        region,
        country,
        source,
        climate,
        addressId,
        updatedAt: Date.now(),
      };
      setLocation(pref);
      if (source !== "ip") saveStored(pref);
      setLocalError(null);
    },
    []
  );

  const requestGeolocation = useCallback(async () => {
    setLocalError(null);
    const result = await geo.requestLocation();
    if (result) {
      // Determine source: if geo had an error (permission denied etc.) and
      // still returned via IP fallback, use "ip"; otherwise "geolocation"
      const source: LocationSource = geo.error ? "ip" : "geolocation";
      applyLocation(result.postalCode, result.city, result.region, result.country, source);
    }
  }, [geo, applyLocation]);

  const setManualPostalCode = useCallback(
    (postalCode: string) => {
      const trimmed = postalCode.trim();
      if (!trimmed) return;
      const regionLabel = postalCodeToRegionLabel(trimmed);
      applyLocation(trimmed, "", regionLabel, "", "manual");
    },
    [applyLocation]
  );

  const setFromAddress = useCallback(
    (address: { id: string; postal_code: string; city: string; province: string; country: string }) => {
      applyLocation(
        address.postal_code,
        address.city,
        address.province,
        address.country,
        "saved_address",
        address.id
      );
    },
    [applyLocation]
  );

  const clearLocation = useCallback(() => {
    setLocation(null);
    setLocalError(null);
    localStorage.removeItem(STORAGE_KEY);
    ipFetchedRef.current = false;
  }, []);

  return {
    location,
    permission: geo.permission,
    loading: geo.loading,
    error: localError || geo.error,
    requestGeolocation,
    setManualPostalCode,
    setFromAddress,
    clearLocation,
    isGeoAvailable,
  };
}
