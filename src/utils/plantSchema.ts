/**
 * Unified plant export schema.
 *
 * Consolidates the header list previously duplicated across
 * exportCatalogXlsx, plantCsvTemplate and plantXlsxTemplate into a
 * single source of truth.
 */

// ── Header list used by every export format ──────────────────────────

export const PLANT_EXPORT_HEADERS = [
  "slug",
  "name",
  "scientific_name",
  "common_name",
  "plant_type",
  "category_slug",
  "short_description",
  "description",
  "notes",
  "price",
  "sale_price",
  "stock_qty",
  "is_in_stock",
  "is_active",
  "is_featured",
  "display_order",
  "container_size",
  "germination_date",
  "mature_height",
  "mature_width",
  "growth_rate",
  "climate_zones",
  "hardiness_zone",
  "min_temp_c",
  "exposure",
  "sun_requirement",
  "water",
  "water_requirement",
  "humidity",
  "temperature_range",
  "difficulty",
  "rarity",
  "origin_country",
  "origin_region",
  "native_habitat",
  "plant_use",
  "images",
  "thumbnail_url",
  "meta_title",
  "meta_description",
  "care_watering",
  "care_fertilizing",
  "care_pruning",
  "care_repotting",
  "curious_facts",
  "spec_familia",
  "spec_genero",
] as const;

// ── Row type derived from header tuple ───────────────────────────────

export type PlantExportHeader = (typeof PLANT_EXPORT_HEADERS)[number];

export interface PlantExportRow
  extends Record<PlantExportHeader, string | number | boolean | null> {}

// ── Field documentation / validation rules ───────────────────────────

export interface PlantTemplateField {
  key: PlantExportHeader;
  type: "texto" | "enum" | "number" | "bool";
  allowedValues?: string;
  notes?: string;
}

export const PLANT_TEMPLATE_FIELDS: PlantTemplateField[] = [
  { key: "slug", type: "texto", notes: "Identificador unico, minusculas-con-guiones" },
  { key: "name", type: "texto" },
  { key: "scientific_name", type: "texto" },
  { key: "common_name", type: "texto" },
  { key: "plant_type", type: "enum", allowedValues: "palm|fern|cycad|tree|shrub|bamboo|succulent|cactus|bromeliad|other" },
  { key: "category_slug", type: "texto", notes: "palmeras | helechos-arboreos | cicadas | arbustos-ornamentales" },
  { key: "short_description", type: "texto", notes: "Max 100 chars" },
  { key: "description", type: "texto" },
  { key: "notes", type: "texto", notes: "Notas internas (no publicas)" },
  { key: "price", type: "number" },
  { key: "sale_price", type: "number" },
  { key: "stock_qty", type: "number" },
  { key: "is_in_stock", type: "bool", allowedValues: "true|false" },
  { key: "is_active", type: "bool", allowedValues: "true|false" },
  { key: "is_featured", type: "bool", allowedValues: "true|false" },
  { key: "display_order", type: "number" },
  { key: "container_size", type: "texto", notes: "3 litros | 5 litros | 7 litros | 10 litros" },
  { key: "germination_date", type: "texto" },
  { key: "mature_height", type: "texto" },
  { key: "mature_width", type: "texto" },
  { key: "growth_rate", type: "enum", allowedValues: "Lento|Medio|Rapido" },
  { key: "climate_zones", type: "texto", notes: "Separar con |" },
  { key: "hardiness_zone", type: "texto", notes: "Rango, ej: 9a-11b" },
  { key: "min_temp_c", type: "number" },
  { key: "exposure", type: "enum", allowedValues: "full_sun|partial_shade|full_shade", notes: "Separar con |" },
  { key: "sun_requirement", type: "texto" },
  { key: "water", type: "enum", allowedValues: "low|medium|high" },
  { key: "water_requirement", type: "texto" },
  { key: "humidity", type: "enum", allowedValues: "low|medium|high" },
  { key: "temperature_range", type: "texto" },
  { key: "difficulty", type: "enum", allowedValues: "easy|intermediate|advanced" },
  { key: "rarity", type: "enum", allowedValues: "common|medium|rare|very_rare" },
  { key: "origin_country", type: "texto" },
  { key: "origin_region", type: "texto" },
  { key: "native_habitat", type: "texto" },
  { key: "plant_use", type: "texto", allowedValues: "indoor|outdoor|container|landscape", notes: "Separar con |" },
  { key: "images", type: "texto", notes: "URLs separadas con |" },
  { key: "thumbnail_url", type: "texto" },
  { key: "meta_title", type: "texto", notes: "Max 60 chars" },
  { key: "meta_description", type: "texto", notes: "Max 160 chars" },
  { key: "care_watering", type: "texto" },
  { key: "care_fertilizing", type: "texto" },
  { key: "care_pruning", type: "texto" },
  { key: "care_repotting", type: "texto" },
  { key: "curious_facts", type: "texto", notes: "Separar con |" },
  { key: "spec_familia", type: "texto" },
  { key: "spec_genero", type: "texto" },
];
