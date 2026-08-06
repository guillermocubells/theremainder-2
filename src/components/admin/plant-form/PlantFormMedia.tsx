import { ImageUploader } from "../ImageUploader";
import type { PlantFormSectionProps } from "./plantFormSchema";

export function PlantFormMedia({
  formData,
  handleChange,
}: PlantFormSectionProps) {
  return (
    <div className="space-y-4">
      <ImageUploader
        images={formData.images}
        onImagesChange={(urls) => handleChange("images", urls)}
        productImages={formData.product_images}
        onProductImagesChange={(pi) => handleChange("product_images", pi)}
        primaryImage={formData.primary_image ?? undefined}
        onPrimaryImageChange={(pi) => handleChange("primary_image", pi)}
      />
      {formData.images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Usa el menú ⋯ en cada imagen para marcarla como imagen de producto o principal.
        </p>
      )}
    </div>
  );
}
