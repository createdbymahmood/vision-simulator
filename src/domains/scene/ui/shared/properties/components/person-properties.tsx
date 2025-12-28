import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PersonEntity } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface PersonPropertiesProps {
  person: PersonEntity;
  onChange: (patch: Partial<PersonEntity>) => void;
}

export function PersonProperties({ person, onChange }: PersonPropertiesProps) {
  return (
    <div className="space-y-3">
      <NumericField
        label="X (m)"
        value={person.position.x}
        onChange={(value) => onChange({ position: { ...person.position, x: value } })}
      />
      <NumericField
        label="Y (m)"
        value={person.position.y}
        onChange={(value) => onChange({ position: { ...person.position, y: value } })}
      />
      <NumericField label="Speed (m/s)" value={person.speed} min={0} onChange={(value) => onChange({ speed: Math.max(0, value) })} />
      <NumericField label="Radius (m)" value={person.radius} min={0.1} onChange={(value) => onChange({ radius: Math.max(0.1, value) })} />
      <div className="flex items-center gap-2">
        <Label>Trail</Label>
        <Switch checked={person.trailEnabled} onCheckedChange={(checked) => onChange({ trailEnabled: Boolean(checked) })} />
      </div>
    </div>
  );
}
