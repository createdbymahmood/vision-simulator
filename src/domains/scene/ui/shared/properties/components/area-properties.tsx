import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AreaEntity } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface AreaPropertiesProps {
  area: AreaEntity;
  onChange: (patch: Partial<AreaEntity>) => void;
}

export function AreaProperties({ area, onChange }: AreaPropertiesProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={area.name} onChange={(event) => onChange({ name: event.target.value })} />
      </div>
      <NumericField label="Points" value={area.pointCount} onChange={(value) => onChange({ pointCount: value })} />
      <p className="text-xs text-muted-foreground">Active area bounds locked to drawn geometry.</p>
    </div>
  );
}
