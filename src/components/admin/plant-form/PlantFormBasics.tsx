import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "./FieldError";
import type { PlantFormSectionProps, Category } from "./plantFormSchema";

interface PlantFormBasicsProps extends PlantFormSectionProps {
  categories: Category[];
}

export function PlantFormBasics({
  formData,
  handleChange,
  errors,
  categories,
}: PlantFormBasicsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          <FieldError error={errors.name} />
        </div>
        <div>
          <Label htmlFor="scientific_name">Nombre científico</Label>
          <Input
            id="scientific_name"
            value={formData.scientific_name}
            onChange={(e) => handleChange("scientific_name", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="common_name">Nombre común</Label>
          <Input
            id="common_name"
            value={formData.common_name}
            onChange={(e) => handleChange("common_name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            className={errors.slug ? "border-destructive" : ""}
          />
          <FieldError error={errors.slug} />
        </div>
      </div>

      <div>
        <Label htmlFor="short_description">Descripción corta</Label>
        <Input
          id="short_description"
          value={formData.short_description}
          onChange={(e) => handleChange("short_description", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción completa</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category_id">Categoría</Label>
          <Select
            value={formData.category_id}
            onValueChange={(v) => handleChange("category_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Precio (€) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className={errors.price ? "border-destructive" : ""}
          />
          <FieldError error={errors.price} />
        </div>
        <div>
          <Label htmlFor="sale_price">Precio oferta (€)</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.sale_price}
            onChange={(e) => handleChange("sale_price", e.target.value)}
            className={errors.sale_price ? "border-destructive" : ""}
          />
          <FieldError error={errors.sale_price} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
            className={errors.stock ? "border-destructive" : ""}
          />
          <FieldError error={errors.stock} />
        </div>
        <div>
          <Label htmlFor="container_size">Tamaño contenedor</Label>
          <Input
            id="container_size"
            value={formData.container_size}
            onChange={(e) => handleChange("container_size", e.target.value)}
            placeholder="ej: C-2 (2L)"
          />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(v) => handleChange("is_active", v)}
          />
          <Label htmlFor="is_active">Publicada</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(v) => handleChange("is_featured", v)}
          />
          <Label htmlFor="is_featured">Destacada</Label>
        </div>
      </div>
    </div>
  );
}
