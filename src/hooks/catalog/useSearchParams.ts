import type { SearchFilters, SortKey } from "./useSearchCatalog";

// ── URL serialization helpers ────────────────────────────────────────

const ARRAY_FILTER_KEYS: (keyof SearchFilters)[] = [
  "plant_type", "difficulty", "rarity", "water", "humidity",
  "exposure", "climate_zone", "hardiness_zone", "plant_use",
  "tags", "origin_country",
];

const VALID_SORTS = new Set<SortKey>(["relevance", "price_asc", "price_desc", "newest", "name_asc", "rarity_desc", "climate_fit"]);

export function filtersFromSearchParams(sp: URLSearchParams): {
  filters: SearchFilters;
  sort: SortKey;
  page: number;
  pageSize: number;
} {
  const filters: SearchFilters = {};
  const q = sp.get("q");
  if (q) filters.q = q;

  for (const key of ARRAY_FILTER_KEYS) {
    const vals = sp.getAll(key);
    if (vals.length) (filters as Record<string, unknown>)[key] = vals;
  }

  const category = sp.get("category");
  if (category) filters.category = category;

  const minPrice = sp.get("min_price");
  if (minPrice) filters.min_price = Number(minPrice);
  const maxPrice = sp.get("max_price");
  if (maxPrice) filters.max_price = Number(maxPrice);

  const inStock = sp.get("in_stock");
  if (inStock === "true") filters.in_stock = true;
  const featured = sp.get("featured");
  if (featured === "true") filters.featured = true;

  // Climate filters
  const hardinessMin = sp.get("hardiness_min");
  if (hardinessMin) filters.hardiness_min = hardinessMin;
  const hardinessMax = sp.get("hardiness_max");
  if (hardinessMax) filters.hardiness_max = hardinessMax;
  const minTempMax = sp.get("min_temp_max");
  if (minTempMax) filters.min_temp_max = Number(minTempMax);
  const climateFitMin = sp.get("climate_fit_min");
  if (climateFitMin) filters.climate_fit_min = Number(climateFitMin);
  const addressId = sp.get("address_id");
  if (addressId) filters.address_id = addressId;

  const rawSort = sp.get("sort") as SortKey | null;
  const sort: SortKey = rawSort && VALID_SORTS.has(rawSort) ? rawSort : "relevance";

  const rawPage = parseInt(sp.get("page") || "1", 10);
  const page = rawPage > 0 ? rawPage : 1;

  const rawPs = parseInt(sp.get("page_size") || "24", 10);
  const pageSize = [12, 24, 48].includes(rawPs) ? rawPs : 24;

  return { filters, sort, page, pageSize };
}

export function filtersToSearchParams(
  filters: SearchFilters,
  sort: SortKey,
  page: number,
  pageSize: number,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);

  for (const key of ARRAY_FILTER_KEYS) {
    const vals = filters[key] as string[] | undefined;
    if (vals?.length) vals.forEach(v => sp.append(key, v));
  }

  if (filters.category) sp.set("category", filters.category);
  if (filters.min_price != null) sp.set("min_price", filters.min_price.toString());
  if (filters.max_price != null) sp.set("max_price", filters.max_price.toString());
  if (filters.in_stock) sp.set("in_stock", "true");
  if (filters.featured) sp.set("featured", "true");

  // Climate filters
  if (filters.hardiness_min) sp.set("hardiness_min", filters.hardiness_min);
  if (filters.hardiness_max) sp.set("hardiness_max", filters.hardiness_max);
  if (filters.min_temp_max != null) sp.set("min_temp_max", filters.min_temp_max.toString());
  if (filters.climate_fit_min != null) sp.set("climate_fit_min", filters.climate_fit_min.toString());
  if (filters.address_id) sp.set("address_id", filters.address_id);

  if (sort !== "relevance") sp.set("sort", sort);
  if (page > 1) sp.set("page", page.toString());
  if (pageSize !== 24) sp.set("page_size", pageSize.toString());

  return sp;
}
