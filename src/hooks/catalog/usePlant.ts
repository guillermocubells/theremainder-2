import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { plants, Plant } from "@/data/plants";
import { plantDetails, PlantDetailData } from "@/data/plantDetailData";

const mapWater = (w: string | null): Plant["waterNeeds"] => {
  if (!w) return undefined;
  if (w === "low") return "Baja" as const;
  if (w === "high") return "Alta" as const;
  return "Moderada" as const;
};

const mapLight = (exp: string[] | null): string => {
  if (!exp?.length) return "Semisol";
  const f = exp[0];
  if (f === "full_sun" || f === "sol") return "Soleada";
  if (f === "shade" || f === "full_shade" || f === "sombra") return "Sombreada";
  return "Semisol";
};

const mapGrowth = (g: string | null): string => {
  if (!g) return "Medio";
  if (g.toLowerCase() === "slow") return "Lento";
  if (g.toLowerCase() === "fast") return "Rápido";
  return "Medio";
};

interface PlantWithDetail {
  plant: Plant;
  detail: PlantDetailData | undefined;
}

async function fetchPlantFromDb(plantId: string): Promise<PlantWithDetail | null> {
  // Try slug first
  let { data } = await supabase
    .from("plants")
    .select("*")
    .eq("slug", plantId)
    .eq("is_active", true)
    .maybeSingle();

  // Fallback: try by UUID id
  if (!data && plantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const res = await supabase
      .from("plants")
      .select("*")
      .eq("id", plantId)
      .maybeSingle();
    data = res.data;
  }

  if (!data) return null;

  const row = data as Record<string, unknown>;
  const images = (row.images as string[] | null) || [];
  const thumbnail = row.thumbnail_url as string | null;
  const allImages = thumbnail && !images.includes(thumbnail)
    ? [thumbnail, ...images]
    : images;

  const mapped: Plant = {
    id: row.slug as string,
    name: row.name as string,
    variety: (row.variety as string) || "",
    quantity: (row.stock_qty as number) ?? 0,
    commonName: (row.common_name as string) || (row.name as string),
    description: (row.short_description as string) || (row.description as string) || "",
    link: (row.reference_url as string) || "",
    location: (row.origin_country as string) || "",
    light: mapLight(row.exposure as string[] | null),
    growthRate: mapGrowth(row.growth_rate as string | null),
    notes: (row.notes as string) || "",
    price: row.sale_price ? (row.sale_price as number) : (row.price as number) ?? 0,
    images: allImages,
    hardinessZones: (row.hardiness_zones as string[] | null) || [],
    climateZones: (row.climate_zones as string[] | null) || [],
    waterNeeds: mapWater(row.water as string | null),
    containerSize: (row.container_size as string) || undefined,
    germinationDate: (row.germination_date as string) || undefined,
  };

  const care = row.care_instructions as Record<string, string> | null;
  const facts = row.curious_facts as string[] | null;
  const specs = row.specifications as Record<string, string> | null;

  const detail: PlantDetailData = {
    family: specs?.family || (row.plant_type as string) || undefined,
    origin: [row.origin_country, row.origin_region].filter(Boolean).join(", ") || undefined,
    height: (row.mature_height as string) || undefined,
    climate: (row.temperature_range as string) || undefined,
    careInstructions: care ? Object.values(care) : undefined,
    characteristics: [
      row.native_habitat && `Hábitat: ${row.native_habitat}`,
      row.mature_height && `Altura: ${row.mature_height}`,
      row.mature_width && `Ancho: ${row.mature_width}`,
    ].filter(Boolean) as string[],
    curiousFacts: facts || undefined,
  };

  return { plant: mapped, detail };
}

export function usePlant(plantId: string | undefined) {
  // Try static data first
  const staticPlant = plantId ? plants.find(p => p.id === plantId) : undefined;
  const staticDetail = staticPlant ? plantDetails[staticPlant.id] : undefined;

  const { data: dbResult, isLoading, error } = useQuery({
    queryKey: ["plant", plantId],
    queryFn: () => fetchPlantFromDb(plantId!),
    enabled: !!plantId && !staticPlant,
    staleTime: 5 * 60 * 1000,
  });

  const plant = staticPlant || dbResult?.plant || null;
  const detail = staticPlant ? staticDetail : dbResult?.detail;

  return {
    plant,
    detail,
    loading: !staticPlant && isLoading,
    error: error as Error | null,
  };
}
