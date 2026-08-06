import { AlertCircle } from "lucide-react";

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {error}
    </p>
  );
}
