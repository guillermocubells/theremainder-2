import { Plant } from "@/data/plants";
import { plantDetails } from "@/data/plantDetailData";
import {
  EUROPEAN_CLIMATE_MAP,
  POSTAL_CODE_RANGES,
  POSTAL_CODE_PATTERNS,
  PLANT_TYPE_KEYWORDS,
} from "@/data/climateData";

export interface ViabilityFactors {
  globalViability: number;
  coldResistance: number;
  humidityTolerance: number;
  clayAdaptation: number;
  sunExposure: number;
  pestResistance: number;
}

export interface ViabilityResult {
  totalScore: number;
  factors: ViabilityFactors;
  recommendation: string;
}

export interface ClimateInfo {
  zone: string;
  hardiness: string;
  humidity: string;
  sunIntensity: string;
  coldTolerance: number;
  humidityLevel: number;
  sunLevel: number;
  region: string;
}

// Default fallback climate
const DEFAULT_CLIMATE: ClimateInfo = {
  zone: "Mediterráneo General",
  hardiness: "Zona 8b-9a",
  humidity: "Media (50-70%)",
  sunIntensity: "Alta (2400h/año)",
  coldTolerance: 7,
  humidityLevel: 6,
  sunLevel: 8,
  region: "mediterraneo"
};

// Enhanced plant type classification system
const getPlantTypeFromName = (plantName: string): string => {
  const name = plantName.toLowerCase();

  for (const entry of PLANT_TYPE_KEYWORDS) {
    if (entry.keywords.some((kw) => name.includes(kw))) {
      return entry.type;
    }
  }

  return 'tropical';
};

// Enhanced postal code climate analysis with European mapping
export const analyzePostalCodeClimate = (postalCode: string): ClimateInfo => {
  const code = parseInt(postalCode.replace(/\D/g, ''));

  // --- UK alpha postcodes (pattern-based) ---
  if (postalCode.match(/^[A-Z]/i)) {
    const upper = postalCode.toUpperCase();
    for (const pattern of POSTAL_CODE_PATTERNS) {
      if (pattern.prefixes.some((prefix) => upper.startsWith(prefix))) {
        return EUROPEAN_CLIMATE_MAP[pattern.country][pattern.region];
      }
    }
    // Fallback: any UK alpha postcode defaults to England
    return EUROPEAN_CLIMATE_MAP.uk.england;
  }

  // --- Numeric postal codes (range-based) ---
  for (const entry of POSTAL_CODE_RANGES) {
    // Check optional guards
    if (entry.guard) {
      if (entry.guard.postalCodeLength !== undefined && postalCode.length !== entry.guard.postalCodeLength) continue;
      if (entry.guard.containsDash !== undefined && entry.guard.containsDash !== postalCode.includes('-')) continue;
    }

    // Check if the numeric code falls within any of the declared ranges
    const matched = entry.ranges.some((r) => code >= r.min && code <= r.max);
    if (matched) {
      return EUROPEAN_CLIMATE_MAP[entry.country][entry.region];
    }
  }

  // Default Mediterranean climate for unrecognized European codes
  return { ...DEFAULT_CLIMATE };
};

// Enhanced location climate analysis with European mapping
const analyzeLocationClimate = (location: string): {
  coldTolerance: number,
  humidity: number,
  sunIntensity: number,
  region: string
} => {
  const loc = location.toLowerCase();

  // Check all European regions
  for (const [country, regions] of Object.entries(EUROPEAN_CLIMATE_MAP)) {
    for (const [regionKey, climate] of Object.entries(regions)) {
      const regionName = regionKey.replace('_', ' ');
      if (loc.includes(regionName) || loc.includes(country)) {
        return {
          coldTolerance: climate.coldTolerance,
          humidity: climate.humidityLevel,
          sunIntensity: climate.sunLevel,
          region: climate.region
        };
      }
    }
  }

  // International locations (non-European)
  if (loc.includes('miami') || loc.includes('florida')) {
    return { coldTolerance: 9, humidity: 8, sunIntensity: 9, region: 'subtropical_humedo' };
  }
  if (loc.includes('california')) {
    return { coldTolerance: 8, humidity: 4, sunIntensity: 9, region: 'mediterraneo_seco' };
  }
  if (loc.includes('new york') || loc.includes('nueva york') || loc.includes('boston')) {
    return { coldTolerance: 2, humidity: 6, sunIntensity: 7, region: 'continental_frio' };
  }

  // Default Mediterranean climate
  return { coldTolerance: 7, humidity: 5, sunIntensity: 8, region: 'mediterraneo' };
};

// Enhanced care analysis
export const analyzePlantCare = (plant: Plant, query: string): {
  waterNeeds: string;
  coverageNeeds: string;
  careAdvice: string;
} => {
  const plantType = getPlantTypeFromName(plant.name);
  const plantDetail = plantDetails[plant.id];
  const queryLower = query.toLowerCase();

  let waterNeeds = "Riego moderado";
  let coverageNeeds = "Según exposición solar";
  let careAdvice = "";

  // Water needs analysis
  if (plantType === 'palmera') {
    if (plant.name.includes('Brahea')) {
      waterNeeds = "Riego escaso - tolera sequía una vez establecida";
    } else if (plant.name.includes('Rhopalostylis')) {
      waterNeeds = "Riego abundante - mantener humedad constante";
    } else {
      waterNeeds = "Riego moderado - evitar encharcamiento";
    }
  } else if (plantType === 'helecho') {
    waterNeeds = "Riego abundante - alta humedad ambiental";
  } else if (plantType === 'magnolia') {
    waterNeeds = "Riego moderado - más en época de crecimiento";
  }

  // Coverage needs analysis
  switch (plant.light.toLowerCase()) {
    case 'soleada':
      coverageNeeds = "Pleno sol - sin protección necesaria";
      break;
    case 'semisol':
      coverageNeeds = "Sol parcial - protección en horas más intensas";
      break;
    case 'semisombra':
      coverageNeeds = "Sombra parcial - malla de sombreo 30-50%";
      break;
    case 'sombreada':
      coverageNeeds = "Sombra completa - bajo dosel arbóreo o malla 70%";
      break;
  }

  // Specific care advice
  if (plant.notes.includes('joven') || plant.notes.includes('pequeña')) {
    careAdvice += "Cuando son jóvenes necesitan protección extra. ";
  }
  if (plant.notes.includes('drenaje')) {
    careAdvice += "Asegurar buen drenaje del suelo. ";
  }
  if (plant.notes.includes('heladas')) {
    careAdvice += "Proteger de heladas en invierno. ";
  }

  return { waterNeeds, coverageNeeds, careAdvice };
};

export const calculateViability = (plant: Plant, searchQuery: string, climateData?: ClimateInfo | null): ViabilityResult => {
  const lowerQuery = searchQuery.toLowerCase();
  const plantDetail = plantDetails[plant.id];
  const plantType = getPlantTypeFromName(plant.name);

  // Use climate data if provided (from postal code), otherwise analyze from query
  let locationClimate = { coldTolerance: 7, humidity: 5, sunIntensity: 8, region: 'mediterraneo' };

  if (climateData) {
    locationClimate = {
      coldTolerance: climateData.coldTolerance,
      humidity: climateData.humidityLevel,
      sunIntensity: climateData.sunLevel,
      region: climateData.region
    };
  } else {
    // Extract location from query
    const locationMatch = lowerQuery.match(/(madrid|barcelona|valencia|sevilla|santander|cantabria|asturias|galicia|bilbao|canarias|baleares|london|paris|miami|florida|california|new york)/);
    if (locationMatch) {
      locationClimate = analyzeLocationClimate(locationMatch[0]);
    }
  }

  // Base factors
  let globalViability = 5;
  let coldResistance = 5;
  let humidityTolerance = 5;
  let clayAdaptation = 5;
  let sunExposure = 5;
  let pestResistance = 5;

  // Enhanced plant-specific analysis
  if (plantType === 'palmera') {
    pestResistance = 7; // Generally hardy
    if (plant.name.includes('Rhopalostylis')) {
      coldResistance = 8;
      humidityTolerance = 9;
    } else if (plant.name.includes('Brahea')) {
      coldResistance = 7;
      humidityTolerance = 3;
      sunExposure = 9;
    } else if (plant.name.includes('Chamaedorea')) {
      coldResistance = 9;
      humidityTolerance = 7;
    }
  } else if (plantType === 'helecho') {
    humidityTolerance = 9;
    sunExposure = 3; // Prefer shade
    coldResistance = 6;
  } else if (plantType === 'magnolia') {
    coldResistance = 7;
    humidityTolerance = 6;
    sunExposure = 7;
  }

  // Enhanced location compatibility analysis with climate data
  const climateDiff = Math.abs(locationClimate.coldTolerance - coldResistance) +
                     Math.abs(locationClimate.humidity - humidityTolerance);

  if (climateDiff <= 2) {
    globalViability += 3; // Better bonus for perfect match
  } else if (climateDiff <= 4) {
    globalViability += 1;
  } else if (climateDiff >= 6) {
    globalViability -= 2;
  }

  // Enhanced climate-specific adjustments
  if (climateData) {
    // Adjust based on specific climate zone
    if (climateData.region === 'subtropical' && plantType === 'palmera') {
      globalViability += 2;
      coldResistance += 1;
    }
    if (climateData.region === 'atlantico_humedo' && plantType === 'helecho') {
      globalViability += 2;
      humidityTolerance += 1;
    }
    if (climateData.region === 'continental_seco' && plant.name.includes('Brahea')) {
      globalViability += 1; // Drought tolerant palms do well
    }
  }

  // Soil adaptation based on plant origin
  if (plantDetail?.origin?.includes('Nueva Zelanda') || plantDetail?.origin?.includes('Australia')) {
    clayAdaptation = 8;
  } else if (plantDetail?.origin?.includes('México') || plantDetail?.origin?.includes('Baja California')) {
    clayAdaptation = 6;
  }

  // Sun exposure matching
  const lightRequirement = plant.light.toLowerCase();
  if (lightRequirement === 'soleada' && locationClimate.sunIntensity >= 8) {
    sunExposure = 9;
  } else if (lightRequirement === 'sombreada' && locationClimate.sunIntensity <= 5) {
    sunExposure = 8;
  } else {
    sunExposure = Math.max(3, 10 - Math.abs(locationClimate.sunIntensity - 6));
  }

  // Ensure values are within range
  globalViability = Math.max(1, Math.min(globalViability, 10));
  coldResistance = Math.max(1, Math.min(coldResistance, 10));
  humidityTolerance = Math.max(1, Math.min(humidityTolerance, 10));
  clayAdaptation = Math.max(1, Math.min(clayAdaptation, 10));
  sunExposure = Math.max(1, Math.min(sunExposure, 10));
  pestResistance = Math.max(1, Math.min(pestResistance, 10));

  const totalScore = Math.round(
    (globalViability + coldResistance + humidityTolerance + clayAdaptation + sunExposure + pestResistance) / 6
  );

  const recommendation = getRecommendation(totalScore, locationClimate.region, climateData?.zone);

  return {
    totalScore,
    factors: {
      globalViability,
      coldResistance,
      humidityTolerance,
      clayAdaptation,
      sunExposure,
      pestResistance
    },
    recommendation
  };
};

const getRecommendation = (score: number, region: string, specificZone?: string): string => {
  const regionText = specificZone ? ` para ${specificZone}` :
                    region === 'continental_seco' ? ' para clima continental' :
                    region === 'atlantico_humedo' ? ' para clima atlántico' :
                    region === 'mediterraneo' ? ' para clima mediterráneo' :
                    region === 'subtropical' ? ' para clima subtropical' : '';

  if (score >= 8) return `Excelente opción${regionText} - muy recomendada`;
  if (score >= 7) return `Buena opción${regionText} - recomendada`;
  if (score >= 6) return `Opción viable${regionText} - con cuidados`;
  if (score >= 5) return `Opción moderada${regionText} - requiere atención`;
  if (score >= 4) return `Opción desafiante${regionText} - para expertos`;
  return `Opción muy desafiante${regionText} - no recomendada`;
};
