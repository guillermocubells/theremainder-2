// Extracted climate data for viabilityCalculator.ts
// This file contains declarative lookup data only — no logic.

export interface ClimateProfile {
  zone: string;
  hardiness: string;
  humidity: string;
  sunIntensity: string;
  coldTolerance: number;
  humidityLevel: number;
  sunLevel: number;
  region: string;
}

// Comprehensive European climate mapping
export const EUROPEAN_CLIMATE_MAP: Record<string, Record<string, ClimateProfile>> = {
  // ESPANA - Detailed mapping
  spain: {
    madrid: { zone: "Madrid - Continental", hardiness: "Zona 8b-9a", humidity: "Baja-Media (40-60%)", sunIntensity: "Alta (2800h/ano)", coldTolerance: 6, humidityLevel: 4, sunLevel: 8, region: "continental_seco" },
    cataluna: { zone: "Cataluna - Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Media (50-70%)", sunIntensity: "Alta (2500h/ano)", coldTolerance: 7, humidityLevel: 6, sunLevel: 8, region: "mediterraneo" },
    valencia: { zone: "Valencia - Mediterraneo", hardiness: "Zona 9b-10a", humidity: "Media (45-65%)", sunIntensity: "Muy Alta (2900h/ano)", coldTolerance: 8, humidityLevel: 5, sunLevel: 9, region: "mediterraneo_calido" },
    andalucia: { zone: "Andalucia - Mediterraneo Continental", hardiness: "Zona 9b-10a", humidity: "Baja (35-55%)", sunIntensity: "Muy Alta (3000h/ano)", coldTolerance: 8, humidityLevel: 3, sunLevel: 10, region: "mediterraneo_calido" },
    cantabria: { zone: "Cantabria - Atlantico", hardiness: "Zona 8a-8b", humidity: "Muy Alta (70-85%)", sunIntensity: "Media (1800h/ano)", coldTolerance: 5, humidityLevel: 9, sunLevel: 5, region: "atlantico_humedo" },
    asturias: { zone: "Asturias - Atlantico", hardiness: "Zona 8a-8b", humidity: "Muy Alta (75-90%)", sunIntensity: "Baja (1600h/ano)", coldTolerance: 4, humidityLevel: 9, sunLevel: 4, region: "atlantico_humedo" },
    galicia: { zone: "Galicia - Atlantico", hardiness: "Zona 8a-8b", humidity: "Muy Alta (70-85%)", sunIntensity: "Baja-Media (1700h/ano)", coldTolerance: 5, humidityLevel: 8, sunLevel: 5, region: "atlantico_humedo" },
    pais_vasco: { zone: "Pais Vasco - Atlantico", hardiness: "Zona 8a-8b", humidity: "Alta (65-80%)", sunIntensity: "Media (1900h/ano)", coldTolerance: 5, humidityLevel: 8, sunLevel: 5, region: "atlantico_humedo" },
    murcia: { zone: "Murcia - Mediterraneo Seco", hardiness: "Zona 9b-10a", humidity: "Muy Baja (30-50%)", sunIntensity: "Muy Alta (3100h/ano)", coldTolerance: 8, humidityLevel: 2, sunLevel: 10, region: "mediterraneo_calido" },
    extremadura: { zone: "Extremadura - Continental Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Baja (35-55%)", sunIntensity: "Muy Alta (2900h/ano)", coldTolerance: 7, humidityLevel: 3, sunLevel: 9, region: "continental_calido" },
    castilla_leon: { zone: "Castilla y Leon - Continental", hardiness: "Zona 7b-8b", humidity: "Baja-Media (40-60%)", sunIntensity: "Alta (2600h/ano)", coldTolerance: 5, humidityLevel: 4, sunLevel: 8, region: "continental_seco" },
    castilla_la_mancha: { zone: "Castilla-La Mancha - Continental", hardiness: "Zona 8b-9a", humidity: "Baja (35-55%)", sunIntensity: "Alta (2700h/ano)", coldTolerance: 6, humidityLevel: 3, sunLevel: 8, region: "continental_seco" },
    aragon: { zone: "Aragon - Continental", hardiness: "Zona 7b-9a", humidity: "Baja-Media (40-60%)", sunIntensity: "Alta (2600h/ano)", coldTolerance: 6, humidityLevel: 4, sunLevel: 8, region: "continental_seco" },
    navarra: { zone: "Navarra - Continental-Atlantico", hardiness: "Zona 8a-8b", humidity: "Media-Alta (55-75%)", sunIntensity: "Media (2200h/ano)", coldTolerance: 6, humidityLevel: 7, sunLevel: 6, region: "continental_humedo" },
    la_rioja: { zone: "La Rioja - Continental", hardiness: "Zona 8b-9a", humidity: "Media (45-65%)", sunIntensity: "Alta (2500h/ano)", coldTolerance: 6, humidityLevel: 5, sunLevel: 7, region: "continental_seco" },
    canarias: { zone: "Canarias - Subtropical", hardiness: "Zona 10b-11", humidity: "Media-Alta (60-80%)", sunIntensity: "Alta (2500h/ano)", coldTolerance: 9, humidityLevel: 7, sunLevel: 8, region: "subtropical" },
    baleares: { zone: "Baleares - Mediterraneo Insular", hardiness: "Zona 9b-10a", humidity: "Media (55-75%)", sunIntensity: "Alta (2700h/ano)", coldTolerance: 8, humidityLevel: 6, sunLevel: 9, region: "mediterraneo_insular" }
  },

  // FRANCIA
  france: {
    ile_de_france: { zone: "Ile-de-France - Oceanico Continental", hardiness: "Zona 8a-8b", humidity: "Media (60-75%)", sunIntensity: "Media (1800h/ano)", coldTolerance: 5, humidityLevel: 6, sunLevel: 6, region: "templado_continental" },
    provence: { zone: "Provenza - Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Media (50-70%)", sunIntensity: "Muy Alta (2800h/ano)", coldTolerance: 7, humidityLevel: 5, sunLevel: 9, region: "mediterraneo" },
    bretagne: { zone: "Bretana - Oceanico", hardiness: "Zona 8b-9a", humidity: "Muy Alta (75-85%)", sunIntensity: "Baja (1600h/ano)", coldTolerance: 6, humidityLevel: 9, sunLevel: 4, region: "atlantico_humedo" },
    normandie: { zone: "Normandia - Oceanico", hardiness: "Zona 8a-8b", humidity: "Alta (70-80%)", sunIntensity: "Baja-Media (1700h/ano)", coldTolerance: 5, humidityLevel: 8, sunLevel: 5, region: "atlantico_humedo" },
    alsace: { zone: "Alsacia - Continental", hardiness: "Zona 7a-7b", humidity: "Media (55-70%)", sunIntensity: "Media (1900h/ano)", coldTolerance: 4, humidityLevel: 6, sunLevel: 6, region: "continental_frio" },
    aquitaine: { zone: "Aquitania - Oceanico", hardiness: "Zona 8b-9a", humidity: "Media-Alta (65-80%)", sunIntensity: "Alta (2200h/ano)", coldTolerance: 6, humidityLevel: 7, sunLevel: 7, region: "atlantico_templado" },
    rhone_alpes: { zone: "Rodano-Alpes - Continental Montanoso", hardiness: "Zona 6b-8a", humidity: "Media (50-70%)", sunIntensity: "Alta (2100h/ano)", coldTolerance: 4, humidityLevel: 6, sunLevel: 7, region: "continental_frio" },
    languedoc: { zone: "Languedoc - Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Baja-Media (45-65%)", sunIntensity: "Muy Alta (2700h/ano)", coldTolerance: 7, humidityLevel: 4, sunLevel: 9, region: "mediterraneo" },
    corse: { zone: "Corcega - Mediterraneo Insular", hardiness: "Zona 9b-10a", humidity: "Media (55-75%)", sunIntensity: "Muy Alta (2800h/ano)", coldTolerance: 8, humidityLevel: 6, sunLevel: 9, region: "mediterraneo_insular" }
  },

  // ITALIA
  italy: {
    lombardia: { zone: "Lombardia - Continental", hardiness: "Zona 7b-8b", humidity: "Media (55-70%)", sunIntensity: "Media-Alta (2000h/ano)", coldTolerance: 5, humidityLevel: 6, sunLevel: 7, region: "continental_templado" },
    toscana: { zone: "Toscana - Mediterraneo", hardiness: "Zona 8b-9a", humidity: "Media (50-70%)", sunIntensity: "Alta (2400h/ano)", coldTolerance: 6, humidityLevel: 5, sunLevel: 8, region: "mediterraneo" },
    sicilia: { zone: "Sicilia - Mediterraneo", hardiness: "Zona 9b-10a", humidity: "Baja-Media (45-65%)", sunIntensity: "Muy Alta (2800h/ano)", coldTolerance: 8, humidityLevel: 4, sunLevel: 9, region: "mediterraneo_calido" },
    veneto: { zone: "Veneto - Continental Humedo", hardiness: "Zona 7b-8b", humidity: "Media-Alta (60-75%)", sunIntensity: "Media (1900h/ano)", coldTolerance: 5, humidityLevel: 7, sunLevel: 6, region: "continental_humedo" },
    campania: { zone: "Campania - Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Media (55-70%)", sunIntensity: "Alta (2500h/ano)", coldTolerance: 7, humidityLevel: 6, sunLevel: 8, region: "mediterraneo" },
    piemonte: { zone: "Piamonte - Continental", hardiness: "Zona 7a-8a", humidity: "Media (55-70%)", sunIntensity: "Media (1800h/ano)", coldTolerance: 4, humidityLevel: 6, sunLevel: 6, region: "continental_frio" },
    liguria: { zone: "Liguria - Mediterraneo", hardiness: "Zona 9a-9b", humidity: "Media (60-75%)", sunIntensity: "Alta (2300h/ano)", coldTolerance: 7, humidityLevel: 7, sunLevel: 8, region: "mediterraneo" },
    puglia: { zone: "Puglia - Mediterraneo Seco", hardiness: "Zona 9b-10a", humidity: "Baja-Media (40-60%)", sunIntensity: "Muy Alta (2700h/ano)", coldTolerance: 8, humidityLevel: 4, sunLevel: 9, region: "mediterraneo_calido" }
  },

  // ALEMANIA
  germany: {
    bayern: { zone: "Baviera - Continental", hardiness: "Zona 6b-7b", humidity: "Media (60-75%)", sunIntensity: "Media (1700h/ano)", coldTolerance: 3, humidityLevel: 7, sunLevel: 5, region: "continental_frio" },
    nordrhein_westfalen: { zone: "Renania Norte-Westfalia - Oceanico", hardiness: "Zona 7b-8a", humidity: "Alta (70-80%)", sunIntensity: "Baja-Media (1600h/ano)", coldTolerance: 4, humidityLevel: 8, sunLevel: 5, region: "atlantico_templado" },
    baden_wurttemberg: { zone: "Baden-Wurttemberg - Continental", hardiness: "Zona 7a-8a", humidity: "Media (60-75%)", sunIntensity: "Media (1800h/ano)", coldTolerance: 4, humidityLevel: 7, sunLevel: 6, region: "continental_templado" },
    niedersachsen: { zone: "Baja Sajonia - Oceanico", hardiness: "Zona 7b-8a", humidity: "Alta (70-80%)", sunIntensity: "Baja (1500h/ano)", coldTolerance: 4, humidityLevel: 8, sunLevel: 4, region: "atlantico_templado" },
    berlin: { zone: "Berlin - Continental", hardiness: "Zona 7a-7b", humidity: "Media (60-70%)", sunIntensity: "Media (1600h/ano)", coldTolerance: 3, humidityLevel: 6, sunLevel: 5, region: "continental_frio" }
  },

  // REINO UNIDO
  uk: {
    england: { zone: "Inglaterra - Oceanico Templado", hardiness: "Zona 7b-8b", humidity: "Alta (70-85%)", sunIntensity: "Baja (1500h/ano)", coldTolerance: 4, humidityLevel: 8, sunLevel: 4, region: "templado_humedo" },
    scotland: { zone: "Escocia - Oceanico Frio", hardiness: "Zona 6b-7b", humidity: "Muy Alta (75-90%)", sunIntensity: "Muy Baja (1200h/ano)", coldTolerance: 2, humidityLevel: 9, sunLevel: 3, region: "templado_frio_humedo" },
    wales: { zone: "Gales - Oceanico", hardiness: "Zona 7b-8a", humidity: "Muy Alta (80-90%)", sunIntensity: "Baja (1400h/ano)", coldTolerance: 4, humidityLevel: 9, sunLevel: 4, region: "templado_humedo" },
    northern_ireland: { zone: "Irlanda del Norte - Oceanico", hardiness: "Zona 7b-8a", humidity: "Muy Alta (80-90%)", sunIntensity: "Baja (1300h/ano)", coldTolerance: 4, humidityLevel: 9, sunLevel: 3, region: "templado_humedo" }
  },

  // PORTUGAL
  portugal: {
    lisboa: { zone: "Lisboa - Mediterraneo Atlantico", hardiness: "Zona 9b-10a", humidity: "Media-Alta (60-75%)", sunIntensity: "Alta (2600h/ano)", coldTolerance: 8, humidityLevel: 7, sunLevel: 9, region: "mediterraneo_atlantico" },
    porto: { zone: "Oporto - Atlantico", hardiness: "Zona 9a-9b", humidity: "Alta (70-85%)", sunIntensity: "Media-Alta (2200h/ano)", coldTolerance: 7, humidityLevel: 8, sunLevel: 7, region: "atlantico_templado" },
    algarve: { zone: "Algarve - Mediterraneo", hardiness: "Zona 9b-10a", humidity: "Media (55-70%)", sunIntensity: "Muy Alta (2900h/ano)", coldTolerance: 8, humidityLevel: 6, sunLevel: 10, region: "mediterraneo_calido" }
  },

  // PAISES BAJOS
  netherlands: {
    holland: { zone: "Holanda - Oceanico", hardiness: "Zona 8a-8b", humidity: "Muy Alta (75-85%)", sunIntensity: "Baja (1600h/ano)", coldTolerance: 5, humidityLevel: 9, sunLevel: 4, region: "atlantico_humedo" }
  },

  // BELGICA
  belgium: {
    flanders: { zone: "Flandes - Oceanico", hardiness: "Zona 8a-8b", humidity: "Alta (70-80%)", sunIntensity: "Baja (1500h/ano)", coldTolerance: 5, humidityLevel: 8, sunLevel: 4, region: "atlantico_templado" },
    wallonia: { zone: "Valonia - Oceanico Continental", hardiness: "Zona 7b-8a", humidity: "Alta (70-80%)", sunIntensity: "Baja-Media (1600h/ano)", coldTolerance: 4, humidityLevel: 8, sunLevel: 5, region: "continental_humedo" }
  },

  // SUIZA
  switzerland: {
    plateau: { zone: "Meseta Suiza - Continental Alpino", hardiness: "Zona 6b-7b", humidity: "Media (60-75%)", sunIntensity: "Media (1700h/ano)", coldTolerance: 3, humidityLevel: 7, sunLevel: 6, region: "continental_frio" },
    valais: { zone: "Valais - Continental Seco", hardiness: "Zona 7a-8a", humidity: "Baja (45-60%)", sunIntensity: "Alta (2100h/ano)", coldTolerance: 4, humidityLevel: 4, sunLevel: 7, region: "continental_seco" }
  },

  // AUSTRIA
  austria: {
    vienna: { zone: "Viena - Continental", hardiness: "Zona 7a-7b", humidity: "Media (60-70%)", sunIntensity: "Media (1800h/ano)", coldTolerance: 3, humidityLevel: 6, sunLevel: 6, region: "continental_frio" },
    tyrol: { zone: "Tirol - Alpino", hardiness: "Zona 6a-7a", humidity: "Media-Alta (65-80%)", sunIntensity: "Alta (1900h/ano)", coldTolerance: 2, humidityLevel: 7, sunLevel: 7, region: "continental_montano" }
  },

  // GRECIA
  greece: {
    athens: { zone: "Atenas - Mediterraneo", hardiness: "Zona 9b-10a", humidity: "Baja-Media (45-65%)", sunIntensity: "Muy Alta (2900h/ano)", coldTolerance: 8, humidityLevel: 4, sunLevel: 10, region: "mediterraneo_calido" },
    thessaloniki: { zone: "Tesalonica - Mediterraneo Continental", hardiness: "Zona 9a-9b", humidity: "Media (50-70%)", sunIntensity: "Alta (2600h/ano)", coldTolerance: 7, humidityLevel: 5, sunLevel: 9, region: "mediterraneo" },
    crete: { zone: "Creta - Mediterraneo Insular", hardiness: "Zona 10a-10b", humidity: "Media (55-70%)", sunIntensity: "Muy Alta (3000h/ano)", coldTolerance: 9, humidityLevel: 6, sunLevel: 10, region: "mediterraneo_calido" }
  },

  // PAISES NORDICOS
  sweden: {
    stockholm: { zone: "Estocolmo - Continental Frio", hardiness: "Zona 6a-6b", humidity: "Media-Alta (65-80%)", sunIntensity: "Baja (1800h/ano)", coldTolerance: 2, humidityLevel: 7, sunLevel: 5, region: "continental_frio" },
    gothenburg: { zone: "Gotemburgo - Oceanico Frio", hardiness: "Zona 6b-7a", humidity: "Alta (75-85%)", sunIntensity: "Baja (1600h/ano)", coldTolerance: 2, humidityLevel: 8, sunLevel: 4, region: "atlantico_frio" }
  },

  norway: {
    oslo: { zone: "Oslo - Continental Frio", hardiness: "Zona 6a-6b", humidity: "Media (60-75%)", sunIntensity: "Baja (1700h/ano)", coldTolerance: 1, humidityLevel: 7, sunLevel: 5, region: "continental_frio" },
    bergen: { zone: "Bergen - Oceanico Frio", hardiness: "Zona 7a-7b", humidity: "Muy Alta (85-95%)", sunIntensity: "Muy Baja (1200h/ano)", coldTolerance: 3, humidityLevel: 10, sunLevel: 3, region: "atlantico_muy_humedo" }
  },

  denmark: {
    copenhagen: { zone: "Copenhague - Oceanico", hardiness: "Zona 7b-8a", humidity: "Alta (70-80%)", sunIntensity: "Baja (1600h/ano)", coldTolerance: 4, humidityLevel: 8, sunLevel: 4, region: "atlantico_templado" }
  },

  finland: {
    helsinki: { zone: "Helsinki - Continental Frio", hardiness: "Zona 5b-6a", humidity: "Media-Alta (70-80%)", sunIntensity: "Baja (1800h/ano)", coldTolerance: 1, humidityLevel: 8, sunLevel: 5, region: "continental_muy_frio" }
  },

  // EUROPA DEL ESTE
  poland: {
    warsaw: { zone: "Varsovia - Continental", hardiness: "Zona 6b-7a", humidity: "Media (60-75%)", sunIntensity: "Media (1700h/ano)", coldTolerance: 2, humidityLevel: 7, sunLevel: 5, region: "continental_frio" },
    krakow: { zone: "Cracovia - Continental", hardiness: "Zona 6b-7a", humidity: "Media (65-75%)", sunIntensity: "Media (1650h/ano)", coldTolerance: 2, humidityLevel: 7, sunLevel: 5, region: "continental_frio" }
  },

  czechia: {
    prague: { zone: "Praga - Continental", hardiness: "Zona 6b-7a", humidity: "Media (65-75%)", sunIntensity: "Media (1700h/ano)", coldTolerance: 3, humidityLevel: 7, sunLevel: 6, region: "continental_templado" }
  },

  hungary: {
    budapest: { zone: "Budapest - Continental", hardiness: "Zona 7a-7b", humidity: "Media (60-70%)", sunIntensity: "Media-Alta (2000h/ano)", coldTolerance: 3, humidityLevel: 6, sunLevel: 7, region: "continental_templado" }
  },

  romania: {
    bucharest: { zone: "Bucarest - Continental", hardiness: "Zona 7a-7b", humidity: "Media (60-70%)", sunIntensity: "Alta (2100h/ano)", coldTolerance: 3, humidityLevel: 6, sunLevel: 7, region: "continental_templado" }
  }
};

// Postal code range entry: numeric ranges matched by min/max
export interface PostalCodeRangeEntry {
  country: string;
  region: string;
  ranges: { min: number; max: number }[];
  // Optional guard: extra condition to disambiguate overlapping postal code spaces
  guard?: {
    postalCodeLength?: number;
    containsDash?: boolean;
  };
}

// Pattern-based postal code entry (for UK-style alpha postcodes)
export interface PostalCodePatternEntry {
  country: string;
  region: string;
  prefixes: string[];
}

// Declarative postal code ranges — checked in order, first match wins
export const POSTAL_CODE_RANGES: PostalCodeRangeEntry[] = [
  // ── SPAIN (01000–52999) ──────────────────────────────────────────────
  // Outer guard: code >= 1000 && code <= 52999
  { country: "spain", region: "madrid", ranges: [{ min: 28000, max: 28999 }] },
  { country: "spain", region: "cataluna", ranges: [{ min: 8000, max: 8999 }] },
  { country: "spain", region: "valencia", ranges: [{ min: 46000, max: 46999 }] },
  { country: "spain", region: "andalucia", ranges: [{ min: 41000, max: 41999 }] },
  { country: "spain", region: "cantabria", ranges: [{ min: 39000, max: 39999 }] },
  { country: "spain", region: "asturias", ranges: [{ min: 33000, max: 33999 }] },
  { country: "spain", region: "galicia", ranges: [{ min: 15000, max: 15999 }, { min: 27000, max: 27999 }, { min: 32000, max: 32999 }, { min: 36000, max: 36999 }] },
  { country: "spain", region: "pais_vasco", ranges: [{ min: 1000, max: 1999 }, { min: 20000, max: 20999 }, { min: 48000, max: 48999 }] },
  { country: "spain", region: "murcia", ranges: [{ min: 30000, max: 30999 }] },
  { country: "spain", region: "canarias", ranges: [{ min: 35000, max: 35999 }, { min: 38000, max: 38999 }] },
  { country: "spain", region: "baleares", ranges: [{ min: 7000, max: 7999 }] },
  { country: "spain", region: "castilla_leon", ranges: [{ min: 5000, max: 5999 }, { min: 9000, max: 9999 }, { min: 24000, max: 24999 }, { min: 34000, max: 34999 }, { min: 37000, max: 37999 }, { min: 40000, max: 40999 }, { min: 42000, max: 42999 }, { min: 47000, max: 47999 }, { min: 49000, max: 49999 }] },
  { country: "spain", region: "castilla_la_mancha", ranges: [{ min: 2000, max: 2999 }, { min: 13000, max: 13999 }, { min: 16000, max: 16999 }, { min: 19000, max: 19999 }, { min: 45000, max: 45999 }] },
  { country: "spain", region: "aragon", ranges: [{ min: 22000, max: 22999 }, { min: 44000, max: 44999 }, { min: 50000, max: 50999 }] },
  { country: "spain", region: "extremadura", ranges: [{ min: 6000, max: 6999 }, { min: 10000, max: 10999 }] },
  { country: "spain", region: "navarra", ranges: [{ min: 31000, max: 31999 }] },
  { country: "spain", region: "la_rioja", ranges: [{ min: 26000, max: 26999 }] },

  // ── FRANCE (01000–95999) ─────────────────────────────────────────────
  { country: "france", region: "ile_de_france", ranges: [{ min: 75000, max: 75999 }, { min: 77000, max: 78999 }, { min: 91000, max: 95999 }] },
  { country: "france", region: "provence", ranges: [{ min: 13000, max: 13999 }, { min: 83000, max: 84999 }] },
  { country: "france", region: "bretagne", ranges: [{ min: 22000, max: 22999 }, { min: 29000, max: 29999 }, { min: 35000, max: 35999 }, { min: 56000, max: 56999 }] },
  { country: "france", region: "normandie", ranges: [{ min: 14000, max: 14999 }, { min: 27000, max: 27999 }, { min: 50000, max: 50999 }, { min: 61000, max: 61999 }, { min: 76000, max: 76999 }] },
  { country: "france", region: "corse", ranges: [{ min: 20000, max: 20999 }] },

  // ── ITALY (00100–99999) ──────────────────────────────────────────────
  { country: "italy", region: "lombardia", ranges: [{ min: 20000, max: 26999 }] },
  { country: "italy", region: "toscana", ranges: [{ min: 50000, max: 59999 }] },
  { country: "italy", region: "sicilia", ranges: [{ min: 90000, max: 98999 }] },
  { country: "italy", region: "veneto", ranges: [{ min: 30000, max: 32999 }, { min: 35000, max: 37999 }, { min: 45000, max: 45999 }] },

  // ── GERMANY (01000–99999, 5-digit only) ──────────────────────────────
  { country: "germany", region: "bayern", ranges: [{ min: 80000, max: 97999 }], guard: { postalCodeLength: 5 } },
  { country: "germany", region: "nordrhein_westfalen", ranges: [{ min: 40000, max: 59999 }], guard: { postalCodeLength: 5 } },
  { country: "germany", region: "berlin", ranges: [{ min: 10000, max: 14999 }], guard: { postalCodeLength: 5 } },

  // ── PORTUGAL (1000–9999, contains dash) ──────────────────────────────
  { country: "portugal", region: "lisboa", ranges: [{ min: 1000, max: 1999 }], guard: { containsDash: true } },
  { country: "portugal", region: "porto", ranges: [{ min: 4000, max: 4999 }], guard: { containsDash: true } },
  { country: "portugal", region: "algarve", ranges: [{ min: 8000, max: 8999 }], guard: { containsDash: true } },
];

// UK postcodes are alpha-prefix based, not numeric ranges
export const POSTAL_CODE_PATTERNS: PostalCodePatternEntry[] = [
  { country: "uk", region: "scotland", prefixes: ["EH", "G"] },
  { country: "uk", region: "wales", prefixes: ["CF", "LL"] },
  // England is the fallback for any UK alpha postal code
];

// Plant type keyword mapping — first match wins
export const PLANT_TYPE_KEYWORDS: { keywords: string[]; type: string }[] = [
  { keywords: ["rhopalostylis", "ptychosperma", "brahea", "sabal", "chamaedorea", "basselinia"], type: "palmera" },
  { keywords: ["cyathea", "dicksonia"], type: "helecho" },
  { keywords: ["magnolia"], type: "magnolia" },
  { keywords: ["zamia"], type: "cicada" },
  { keywords: ["caryota"], type: "palmera_cola_pez" },
];
