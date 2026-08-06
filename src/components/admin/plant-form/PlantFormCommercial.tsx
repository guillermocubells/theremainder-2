import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlantFormSectionProps } from "./plantFormSchema";

export function PlantFormCommercial({
  formData,
  handleChange,
}: PlantFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="growth_rate">Velocidad crecimiento</Label>
          <Select
            value={formData.growth_rate}
            onValueChange={(v) => handleChange("growth_rate", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Lento</SelectItem>
              <SelectItem value="moderate">Moderado</SelectItem>
              <SelectItem value="fast">Rápido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="mature_height">Altura adulta</Label>
          <Input
            id="mature_height"
            value={formData.mature_height}
            onChange={(e) => handleChange("mature_height", e.target.value)}
            placeholder="ej: 2-3m"
          />
        </div>
        <div>
          <Label htmlFor="mature_width">Anchura adulta</Label>
          <Input
            id="mature_width"
            value={formData.mature_width}
            onChange={(e) => handleChange("mature_width", e.target.value)}
            placeholder="ej: 1-2m"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="germination_date">Fecha germinación</Label>
          <Input
            id="germination_date"
            type="date"
            value={formData.germination_date}
            onChange={(e) => handleChange("germination_date", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="family">Familia</Label>
          <Input
            id="family"
            value={formData.family}
            onChange={(e) => handleChange("family", e.target.value)}
            placeholder="ej: Arecaceae"
          />
        </div>
        <div>
          <Label htmlFor="variety">Variedad</Label>
          <Input
            id="variety"
            value={formData.variety}
            onChange={(e) => handleChange("variety", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="weight_grams">Peso (g)</Label>
        <Input
          id="weight_grams"
          type="number"
          min="0"
          value={formData.weight_grams}
          onChange={(e) => handleChange("weight_grams", e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas internas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
          placeholder="Notas privadas, no visibles al público"
        />
      </div>
    </div>
  );
}
