import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { MultiChipSelect } from "./MultiChipSelect";
import {
  PLANT_TYPES,
  WATER_LEVELS,
  HUMIDITY_LEVELS,
  RARITY_LEVELS,
  DIFFICULTY_LEVELS,
  EXPOSURE_OPTIONS,
  PLANT_USE_OPTIONS,
  CLIMATE_ZONE_OPTIONS,
} from "./plantFormSchema";
import type { PlantFormSectionProps } from "./plantFormSchema";

export function PlantFormBotanical({
  formData,
  handleChange,
  errors,
}: PlantFormSectionProps) {
  const [hardinessInput, setHardinessInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const addHardinessZone = () => {
    const v = hardinessInput.trim().toUpperCase();
    if (v && !formData.hardiness_zones.includes(v)) {
      handleChange("hardiness_zones", [...formData.hardiness_zones, v]);
    }
    setHardinessInput("");
  };

  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (v && !formData.tags.includes(v)) {
      handleChange("tags", [...formData.tags, v]);
    }
    setTagInput("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Tipo de planta</Label>
          <Select
            value={formData.plant_type}
            onValueChange={(v) => handleChange("plant_type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {PLANT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Riego</Label>
          <Select
            value={formData.water}
            onValueChange={(v) => handleChange("water", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {WATER_LEVELS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Humedad</Label>
          <Select
            value={formData.humidity}
            onValueChange={(v) => handleChange("humidity", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {HUMIDITY_LEVELS.map((h) => (
                <SelectItem key={h.value} value={h.value}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Rareza</Label>
          <Select
            value={formData.rarity}
            onValueChange={(v) => handleChange("rarity", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {RARITY_LEVELS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Dificultad</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(v) => handleChange("difficulty", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="min_temp_c">Temp. mín. (°C)</Label>
          <Input
            id="min_temp_c"
            type="number"
            value={formData.min_temp_c}
            onChange={(e) => handleChange("min_temp_c", e.target.value)}
            placeholder="ej: -5"
          />
        </div>
      </div>

      <MultiChipSelect
        label="Exposición"
        options={EXPOSURE_OPTIONS}
        selected={formData.exposure}
        onChange={(v) => handleChange("exposure", v)}
      />

      <MultiChipSelect
        label="Uso"
        options={PLANT_USE_OPTIONS}
        selected={formData.plant_use}
        onChange={(v) => handleChange("plant_use", v)}
      />

      <MultiChipSelect
        label="Zonas climáticas"
        options={CLIMATE_ZONE_OPTIONS}
        selected={formData.climate_zones}
        onChange={(v) => handleChange("climate_zones", v)}
      />

      {/* Hardiness zones as free-text chips */}
      <div>
        <Label>Zonas de rusticidad (USDA)</Label>
        <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
          {formData.hardiness_zones.map((z) => (
            <Badge key={z} variant="default" className="bg-moss gap-1">
              {z}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  handleChange(
                    "hardiness_zones",
                    formData.hardiness_zones.filter((hz) => hz !== z)
                  )
                }
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={hardinessInput}
            onChange={(e) => setHardinessInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHardinessZone();
              }
            }}
            placeholder="ej: 9a, 10b"
            className="max-w-[200px]"
          />
          <Button type="button" variant="outline" size="sm" onClick={addHardinessZone}>
            Añadir
          </Button>
        </div>
      </div>

      {/* Tags as free-text chips */}
      <div>
        <Label>Etiquetas</Label>
        <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
          {formData.tags.map((t) => (
            <Badge key={t} variant="default" className="bg-moss gap-1">
              {t}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  handleChange("tags", formData.tags.filter((tag) => tag !== t))
                }
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="ej: tropical, resistente, rara"
            className="max-w-[300px]"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}
