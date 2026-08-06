import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "./FieldError";
import type { PlantFormSectionProps } from "./plantFormSchema";

export function PlantFormSEO({
  formData,
  handleChange,
  errors,
}: PlantFormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="meta_title">Meta título</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => handleChange("meta_title", e.target.value)}
          maxLength={60}
          placeholder="Máx 60 caracteres"
          className={errors.meta_title ? "border-destructive" : ""}
        />
        <div className="flex items-center justify-between mt-1">
          <FieldError error={errors.meta_title} />
          <p className="text-xs text-muted-foreground">
            {formData.meta_title.length}/60
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="meta_description">Meta descripción</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => handleChange("meta_description", e.target.value)}
          maxLength={160}
          rows={2}
          placeholder="Máx 160 caracteres"
          className={errors.meta_description ? "border-destructive" : ""}
        />
        <div className="flex items-center justify-between mt-1">
          <FieldError error={errors.meta_description} />
          <p className="text-xs text-muted-foreground">
            {formData.meta_description.length}/160
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor="image_alt_text">Alt text imagen</Label>
        <Input
          id="image_alt_text"
          value={formData.image_alt_text}
          onChange={(e) => handleChange("image_alt_text", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="reference_url">URL de referencia</Label>
        <Input
          id="reference_url"
          value={formData.reference_url}
          onChange={(e) => handleChange("reference_url", e.target.value)}
          placeholder="https://..."
          className={errors.reference_url ? "border-destructive" : ""}
        />
        <FieldError error={errors.reference_url} />
      </div>
    </div>
  );
}
