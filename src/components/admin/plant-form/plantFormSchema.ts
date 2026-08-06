import { z } from "zod";

// ── Validation Schema ──
export const plantSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200, "Máx. 200 caracteres"),
  slug: z.string().trim().min(1, "El slug es obligatorio").max(200).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  price: z.string().refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0;
  }, "Introduce un precio válido ≥ 0"),
  sale_price: z.string().refine((v) => {
    if (!v) return true;
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0;
  }, "Precio oferta inválido").optional(),
  stock: z.string().refine((v) => {
    const n = parseInt(v);
    return !isNaN(n) && n >= 0;
  }, "Stock inválido"),
  meta_title: z.string().max(60, "Máx. 60 caracteres").optional(),
  meta_description: z.string().max(160, "Máx. 160 caracteres").optional(),
  reference_url: z.string().url("URL no válida").or(z.literal("")).optional(),
});

// ── Types ──
export type ValidationErrors = Partial<Record<string, string>>;

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface PlantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant?: any;
  onSuccess: () => void | Promise<void>;
}

export const defaultForm = {
  name: "",
  scientific_name: "",
  common_name: "",
  slug: "",
  description: "",
  short_description: "",
  category_id: "",
  price: "",
  sale_price: "",
  stock: "0",
  container_size: "",
  germination_date: "",
  growth_rate: "",
  mature_height: "",
  mature_width: "",
  origin_country: "",
  origin_region: "",
  native_habitat: "",
  is_active: true,
  is_featured: false,
  images: [] as string[],
  product_images: [] as string[],
  primary_image: null as string | null,
  plant_type: "",
  water: "",
  humidity: "",
  rarity: "",
  difficulty: "",
  exposure: [] as string[],
  climate_zones: [] as string[],
  hardiness_zones: [] as string[],
  plant_use: [] as string[],
  tags: [] as string[],
  min_temp_c: "",
  family: "",
  variety: "",
  weight_grams: "",
  notes: "",
  meta_title: "",
  meta_description: "",
  image_alt_text: "",
  reference_url: "",
};

export type PlantFormData = typeof defaultForm;

// ── Shared field-section props ──
export interface PlantFormSectionProps {
  formData: PlantFormData;
  handleChange: (field: string, value: any) => void;
  errors: ValidationErrors;
}

// ── Constants ──
export const PLANT_TYPES = [
  { value: "palm", label: "Palmera" },
  { value: "fern", label: "Helecho arbóreo" },
  { value: "cycad", label: "Cícada" },
  { value: "tree", label: "Árbol ornamental" },
  { value: "shrub", label: "Arbusto" },
  { value: "succulent", label: "Suculenta" },
  { value: "grass", label: "Hierba" },
  { value: "bamboo", label: "Bambú" },
  { value: "bromeliad", label: "Bromeliácea" },
  { value: "heliconia", label: "Heliconia" },
  { value: "strelitzia", label: "Estrelicia" },
  { value: "ginger", label: "Jengibre" },
  { value: "banana", label: "Plátano" },
  { value: "agave", label: "Agave / Yuca" },
  { value: "aroid", label: "Arácea" },
  { value: "cactus", label: "Cactus" },
  { value: "conifer", label: "Conífera" },
  { value: "perennial", label: "Perenne" },
  { value: "other", label: "Otro" },
];

export const WATER_LEVELS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
];

export const HUMIDITY_LEVELS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

export const RARITY_LEVELS = [
  { value: "common", label: "Común" },
  { value: "uncommon", label: "Poco común" },
  { value: "rare", label: "Rara" },
  { value: "very_rare", label: "Muy rara" },
  { value: "extremely_rare", label: "Extremadamente rara" },
];

export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Fácil" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

export const EXPOSURE_OPTIONS = [
  { value: "sol", label: "Sol" },
  { value: "semisol", label: "Semisol" },
  { value: "semisombra", label: "Semisombra" },
  { value: "sombra", label: "Sombra" },
];

export const PLANT_USE_OPTIONS = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "jardin", label: "Jardín" },
  { value: "maceta", label: "Maceta" },
  { value: "seto", label: "Seto" },
  { value: "cobertura", label: "Cobertura" },
];

export const CLIMATE_ZONE_OPTIONS = [
  "tropical",
  "subtropical",
  "mediterráneo",
  "templado",
  "continental",
  "oceánico",
  "árido",
  "semiárido",
];
