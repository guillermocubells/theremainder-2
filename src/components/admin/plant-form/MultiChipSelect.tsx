import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface MultiChipSelectProps {
  label: string;
  options: { value: string; label: string }[] | string[];
  selected: string[];
  onChange: (v: string[]) => void;
}

export function MultiChipSelect({
  label,
  options,
  selected,
  onChange,
}: MultiChipSelectProps) {
  const opts =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ value: o, label: o }))
      : (options as { value: string; label: string }[]);

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {opts.map((o) => {
          const active = selected.includes(o.value);
          return (
            <Badge
              key={o.value}
              variant={active ? "default" : "outline"}
              className={`cursor-pointer select-none ${active ? "bg-moss hover:bg-moss/80" : "hover:bg-muted"}`}
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((s) => s !== o.value)
                    : [...selected, o.value]
                )
              }
            >
              {o.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
