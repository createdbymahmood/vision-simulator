import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { WallSegment } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface WallPropertiesProps {
  wall: WallSegment;
  onChange: (patch: Partial<WallSegment>) => void;
}

export function WallProperties({ wall, onChange }: WallPropertiesProps) {
  return (
    <div className="space-y-3">
      <NumericField
        label="x1 (m)"
        value={wall.start.x}
        step={0.1}
        onChange={(value) => onChange({ start: { ...wall.start, x: value } })}
      />
      <NumericField
        label="y1 (m)"
        value={wall.start.y}
        step={0.1}
        onChange={(value) => onChange({ start: { ...wall.start, y: value } })}
      />
      <NumericField
        label="x2 (m)"
        value={wall.end.x}
        step={0.1}
        onChange={(value) => onChange({ end: { ...wall.end, x: value } })}
      />
      <NumericField
        label="y2 (m)"
        value={wall.end.y}
        step={0.1}
        onChange={(value) => onChange({ end: { ...wall.end, y: value } })}
      />
      <NumericField label="Height (m)" min={0} value={wall.height} onChange={(value) => onChange({ height: Math.max(0, value) })} />
      <NumericField
        label="Thickness (m)"
        min={0.05}
        step={0.05}
        value={wall.thickness}
        onChange={(value) => onChange({ thickness: Math.max(0.05, value) })}
      />
      <div className="flex items-center gap-2">
        <Label>Color</Label>
        <input
          type="color"
          value={wall.color}
          onChange={(event) => onChange({ color: event.target.value })}
          className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
        />
      </div>
      <div>
        <Label>Opacity</Label>
        <Slider value={[wall.opacity]} min={0} max={1} step={0.05} onValueChange={(value) => onChange({ opacity: value[0] ?? wall.opacity })} />
      </div>
    </div>
  );
}
