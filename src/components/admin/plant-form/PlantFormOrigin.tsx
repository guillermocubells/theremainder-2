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
import { COUNTRIES } from "@/data/countries";
import type { PlantFormSectionProps } from "./plantFormSchema";

export function PlantFormOrigin({
  formData,
  handleChange,
}: PlantFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="origin_country">País de origen</Label>
          <Select
            value={formData.origin_country}
            onValueChange={(v) => handleChange("origin_country", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona país..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="origin_region">Región de origen</Label>
          <Input
            id="origin_region"
            value={formData.origin_region}
            onChange={(e) => handleChange("origin_region", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="native_habitat">Hábitat natural</Label>
        <Textarea
          id="native_habitat"
          value={formData.native_habitat}
          onChange={(e) => handleChange("native_habitat", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
