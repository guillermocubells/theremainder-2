import { useState, useEffect } from "react";
import { PLANT_TYPE_TO_CATEGORY_SLUG } from "@/utils/taxonomyMapping";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, ShieldCheck } from "lucide-react";
import {
  plantSchema,
  defaultForm,
} from "./plant-form/plantFormSchema";
import type {
  PlantFormDialogProps,
  PlantFormData,
  ValidationErrors,
  Category,
} from "./plant-form/plantFormSchema";
import { PlantFormBasics } from "./plant-form/PlantFormBasics";
import { PlantFormBotanical } from "./plant-form/PlantFormBotanical";
import { PlantFormCommercial } from "./plant-form/PlantFormCommercial";
import { PlantFormOrigin } from "./plant-form/PlantFormOrigin";
import { PlantFormMedia } from "./plant-form/PlantFormMedia";
import { PlantFormSEO } from "./plant-form/PlantFormSEO";

export function PlantFormDialog({
  open,
  onOpenChange,
  plant,
  onSuccess,
}: PlantFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<PlantFormData>({ ...defaultForm });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // AI autocomplete state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPreserveEdited, setAiPreserveEdited] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [aiResult, setAiResult] = useState<{
    confidence: number;
    confidenceByField: Record<string, number>;
    priceSuggestion: string;
    warnings: string[];
    filledCount: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setHasAttemptedSubmit(false);
      setTouchedFields({});
      setAiResult(null);
      fetchCategories();
      if (plant) {
        setFormData({
          name: plant.name || "",
          scientific_name: plant.scientific_name || "",
          common_name: plant.common_name || "",
          slug: plant.slug || "",
          description: plant.description || "",
          short_description: plant.short_description || "",
          category_id: plant.category_id || "",
          price: plant.price?.toString() || "",
          sale_price: plant.sale_price?.toString() || "",
          stock: plant.stock_qty?.toString() || "0",
          container_size: plant.container_size || "",
          germination_date: plant.germination_date || "",
          growth_rate: plant.growth_rate || "",
          mature_height: plant.mature_height || "",
          mature_width: plant.mature_width || "",
          origin_country: plant.origin_country || "",
          origin_region: plant.origin_region || "",
          native_habitat: plant.native_habitat || "",
          is_active: plant.is_active ?? true,
          is_featured: plant.is_featured ?? false,
          images: plant.images || [],
          product_images: plant.product_images || [],
          primary_image: plant.primary_image || null,
          plant_type: plant.plant_type || "",
          water: plant.water || "",
          humidity: plant.humidity || "",
          rarity: plant.rarity || "",
          difficulty: plant.difficulty || "",
          exposure: plant.exposure || [],
          climate_zones: plant.climate_zones || [],
          hardiness_zones: plant.hardiness_zones || [],
          plant_use: plant.plant_use || [],
          tags: plant.tags || [],
          min_temp_c: plant.min_temp_c?.toString() || "",
          family: plant.family || "",
          variety: plant.variety || "",
          weight_grams: plant.weight_grams?.toString() || "",
          notes: plant.notes || "",
          meta_title: plant.meta_title || "",
          meta_description: plant.meta_description || "",
          image_alt_text: plant.image_alt_text || "",
          reference_url: plant.reference_url || "",
        });
      } else {
        setFormData({ ...defaultForm });
      }
    }
  }, [open, plant]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("display_order", { ascending: true });
    setCategories(data || []);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const validate = (): boolean => {
    const result = plantSchema.safeParse({
      name: formData.name,
      slug: formData.slug,
      price: formData.price,
      sale_price: formData.sale_price || undefined,
      stock: formData.stock,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
      reference_url: formData.reference_url || undefined,
    });

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: ValidationErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !plant) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    // Mark as manually touched
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    // Clear error for this field on change
    if (hasAttemptedSubmit && errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── AI Autocomplete ──
  const handleAiAutocomplete = async () => {
    const textQuery = formData.scientific_name || formData.name || formData.common_name;
    const imageUrls = formData.images.filter((url) => url.startsWith("http"));

    if (!textQuery && imageUrls.length === 0) {
      toast.error("Introduce un nombre o sube im\u00e1genes antes de usar el autocompletado");
      return;
    }

    setIsAiLoading(true);
    setAiResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        toast.error("Sesi\u00f3n expirada");
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plant-autocomplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            textQuery,
            imageUrls: imageUrls.slice(0, 3),
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const result = await resp.json();
      const aiData: Record<string, any> = result.data || {};

      // Fields that should NOT be touched by AI
      const skipFields = new Set(["price", "sale_price", "stock", "germination_date", "is_active", "is_featured", "images", "product_images", "primary_image"]);

      let filledCount = 0;

      setFormData((prev) => {
        const updated = { ...prev };
        for (const [field, value] of Object.entries(aiData)) {
          if (skipFields.has(field)) continue;
          if (!(field in defaultForm)) continue;

          // Check if field has meaningful value from AI
          const hasValue = Array.isArray(value) ? value.length > 0 : value !== "" && value != null;
          if (!hasValue) continue;

          // Respect manually edited fields if toggle is on
          if (aiPreserveEdited && touchedFields[field]) continue;

          // Check if field already has a value (from editing existing plant)
          const currentValue = (prev as any)[field];
          const currentHasValue = Array.isArray(currentValue) ? currentValue.length > 0 : currentValue !== "" && currentValue != null && currentValue !== false;
          if (aiPreserveEdited && currentHasValue && plant) continue;

          (updated as any)[field] = value;
          filledCount++;
        }

        // Auto-map plant_type -> category_id if not manually set
        if (updated.plant_type && (!aiPreserveEdited || !touchedFields["category_id"])) {
          const slug = PLANT_TYPE_TO_CATEGORY_SLUG[updated.plant_type];
          if (slug) {
            const match = categories.find((c) => c.slug === slug);
            if (match) {
              const prevCatHasValue = prev.category_id !== "" && prev.category_id != null;
              if (!(aiPreserveEdited && prevCatHasValue && plant)) {
                updated.category_id = match.id;
                filledCount++;
              }
            }
          }
        }

        return updated;
      });

      setAiResult({
        confidence: result.confidence || 0,
        confidenceByField: result.confidenceByField || {},
        priceSuggestion: result.priceSuggestion || "",
        warnings: result.warnings || [],
        filledCount,
      });

      if (result.priceSuggestion) {
        toast.info(`\uD83D\uDCB0 Sugerencia de precio: ${result.priceSuggestion}`, { duration: 8000 });
      }

      toast.success(
        `Autocompletado listo (${filledCount} campos). ` +
        `Confianza: ${Math.round((result.confidence || 0) * 100)}%. Revisa los valores.`,
        { duration: 6000 }
      );

      // ── Fetch iNaturalist images if species identified and images empty ──
      const scientificName = aiData.scientific_name || aiData.name || "";
      if (scientificName && (!aiPreserveEdited || !touchedFields["images"])) {
        fetchINaturalistImages(scientificName);
      }
    } catch (err: any) {
      console.error("AI autocomplete error:", err);
      toast.error(err.message || "Error al autocompletar con IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchINaturalistImages = async (scientificName: string) => {
    try {
      const query = encodeURIComponent(scientificName.trim());
      const url = `https://api.inaturalist.org/v1/observations?taxon_name=${query}&photos=true&per_page=12&quality_grade=research&order_by=votes&order=desc`;
      const resp = await fetch(url);
      if (!resp.ok) return;

      const data = await resp.json();
      const results = data.results || [];

      // Collect unique medium-quality photo URLs (deduplicate by photo id)
      const seenIds = new Set<number>();
      const photoUrls: string[] = [];

      for (const obs of results) {
        if (photoUrls.length >= 5) break;
        for (const photo of obs.photos || []) {
          if (photoUrls.length >= 5) break;
          if (seenIds.has(photo.id)) continue;
          seenIds.add(photo.id);
          // Replace "square" with "original" for highest quality
          const hiResUrl = (photo.url || "").replace("/square.", "/original.");
          if (hiResUrl) photoUrls.push(hiResUrl);
        }
      }

      if (photoUrls.length === 0) return;

      setFormData((prev) => {
        // Don't overwrite if user already added images
        if (prev.images && prev.images.length > 0 && aiPreserveEdited) return prev;
        return { ...prev, images: photoUrls };
      });

      toast.success(`\uD83D\uDCF7 ${photoUrls.length} im\u00e1genes de iNaturalist a\u00f1adidas. Revisa en la pesta\u00f1a "Media".`, { duration: 5000 });
    } catch (err) {
      console.error("iNaturalist fetch error:", err);
      // Silent fail - images are optional
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validate()) {
      toast.error("Corrige los errores antes de guardar");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        scientific_name: formData.scientific_name || null,
        common_name: formData.common_name || null,
        slug: formData.slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_qty: parseInt(formData.stock) || 0,
        container_size: formData.container_size || null,
        germination_date: formData.germination_date || null,
        growth_rate: formData.growth_rate || null,
        mature_height: formData.mature_height || null,
        mature_width: formData.mature_width || null,
        origin_country: formData.origin_country || null,
        origin_region: formData.origin_region || null,
        native_habitat: formData.native_habitat || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        images: formData.images,
        product_images: formData.product_images,
        primary_image: formData.primary_image,
        plant_type: (formData.plant_type || null) as any,
        water: (formData.water || null) as any,
        humidity: (formData.humidity || null) as any,
        rarity: (formData.rarity || null) as any,
        difficulty: (formData.difficulty || null) as any,
        exposure: formData.exposure,
        climate_zones: formData.climate_zones,
        hardiness_zones: formData.hardiness_zones,
        plant_use: formData.plant_use,
        tags: formData.tags,
        min_temp_c: formData.min_temp_c ? parseInt(formData.min_temp_c) : null,
        family: formData.family || null,
        variety: formData.variety || null,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : null,
        notes: formData.notes || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        image_alt_text: formData.image_alt_text || null,
        reference_url: formData.reference_url || null,
      };

      if (plant) {
        const { error } = await supabase
          .from("plants")
          .update(payload)
          .eq("id", plant.id);
        if (error) throw error;
        toast.success("Planta actualizada correctamente");
      } else {
        const { error } = await supabase.from("plants").insert(payload);
        if (error) throw error;
        toast.success("Planta creada correctamente");
      }

      await onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving plant:", error);
      toast.error(error.message || "Error al guardar la planta");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count errors per tab for badge indicators
  const generalErrors = ["name", "slug", "price", "sale_price", "stock"].filter((k) => errors[k]).length;
  const seoErrors = ["meta_title", "meta_description", "reference_url"].filter((k) => errors[k]).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <DialogTitle>
              {plant ? "Editar Planta" : "Nueva Planta"}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch
                  id="ai-preserve"
                  checked={aiPreserveEdited}
                  onCheckedChange={setAiPreserveEdited}
                  className="scale-75"
                />
                <Label htmlFor="ai-preserve" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  <ShieldCheck className="h-3 w-3 inline mr-0.5" />
                  No sobrescribir
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiAutocomplete}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                {isAiLoading ? "Analizando\u2026" : "Autocompletar con IA"}
              </Button>
            </div>
          </div>
          {aiResult && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span>
                \u2705 {aiResult.filledCount} campos \u00b7 Confianza {Math.round(aiResult.confidence * 100)}%
              </span>
              {aiResult.warnings.length > 0 && (
                <span className="text-destructive">
                  \u26a0 {aiResult.warnings[0]}
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            <Tabs defaultValue="general" className="w-full px-1">
              <TabsList className="grid grid-cols-6 w-full mb-4">
                <TabsTrigger value="general" className="relative">
                  General
                  {generalErrors > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {generalErrors}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="origin">Origen</TabsTrigger>
                <TabsTrigger value="media">Im\u00e1genes</TabsTrigger>
                <TabsTrigger value="seo" className="relative">
                  SEO
                  {seoErrors > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {seoErrors}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <PlantFormBasics
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                  categories={categories}
                />
              </TabsContent>

              <TabsContent value="attributes">
                <PlantFormBotanical
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="details">
                <PlantFormCommercial
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="origin">
                <PlantFormOrigin
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="media">
                <PlantFormMedia
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </TabsContent>

              <TabsContent value="seo">
                <PlantFormSEO
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-moss hover:bg-moss/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {plant ? "Guardar cambios" : "Crear planta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
