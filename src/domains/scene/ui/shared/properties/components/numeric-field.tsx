import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumericFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumericField({ label, value, min, max, step = 0.1, onChange }: NumericFieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </div>
  );
}
