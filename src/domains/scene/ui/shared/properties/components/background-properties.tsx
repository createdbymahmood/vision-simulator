import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { BackgroundLayer } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface BackgroundPropertiesProps {
  background: BackgroundLayer;
  onChange: (patch: Partial<BackgroundLayer>) => void;
}

export function BackgroundProperties({ background, onChange }: BackgroundPropertiesProps) {
  return (
    <div className="space-y-3">
      <NumericField label="Opacity" value={background.opacity} min={0} max={1} step={0.05} onChange={(value) => onChange({ opacity: value })} />
      <NumericField label="Scale" value={background.scale} min={0.1} step={0.1} onChange={(value) => onChange({ scale: value })} />
      <NumericField label="Rotation" value={background.rotation} step={1} onChange={(value) => onChange({ rotation: value })} />
      <div className="flex items-center gap-2">
        <Label>Locked</Label>
        <Switch checked={background.locked} onCheckedChange={(checked) => onChange({ locked: Boolean(checked) })} />
      </div>
    </div>
  );
}
