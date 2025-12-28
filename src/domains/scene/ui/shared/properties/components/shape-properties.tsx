import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ShapeEntity } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface ShapePropertiesProps {
  shape: ShapeEntity;
  onChange: (patch: Partial<ShapeEntity>) => void;
}

export function ShapeProperties({ shape, onChange }: ShapePropertiesProps) {
  return (
    <div className="space-y-3">
      <NumericField
        label="X (m)"
        value={shape.position.x}
        onChange={(value) => onChange({ position: { ...shape.position, x: value } })}
      />
      <NumericField
        label="Y (m)"
        value={shape.position.y}
        onChange={(value) => onChange({ position: { ...shape.position, y: value } })}
      />
      <NumericField
        label="Rotation (deg)"
        value={shape.rotation}
        onChange={(value) => onChange({ rotation: value % 360 })}
      />
      <NumericField
        label="Width (m)"
        value={shape.width}
        min={0.1}
        onChange={(value) => onChange({ width: Math.max(0.1, value) })}
      />
      <NumericField
        label="Length (m)"
        value={shape.length}
        min={0.1}
        onChange={(value) => onChange({ length: Math.max(0.1, value) })}
      />
      <NumericField
        label="Height (m)"
        value={shape.height}
        min={0}
        onChange={(value) => onChange({ height: Math.max(0, value) })}
      />
      {shape.shape === "circle" ? (
        <NumericField
          label="Radius (m)"
          value={shape.radius ?? 1}
          min={0.1}
          onChange={(value) => onChange({ radius: Math.max(0.1, value) })}
        />
      ) : null}
      {shape.shape === "line" ? (
        <NumericField
          label="Thickness (m)"
          value={shape.lineThickness ?? 0.1}
          min={0.05}
          onChange={(value) => onChange({ lineThickness: Math.max(0.05, value) })}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <Label>Blocks vision</Label>
        <Switch checked={shape.blocksVision} onCheckedChange={(checked) => onChange({ blocksVision: Boolean(checked) })} />
      </div>
      <div className="flex items-center gap-2">
        <Label>Blocks movement</Label>
        <Switch checked={shape.blocksMovement} onCheckedChange={(checked) => onChange({ blocksMovement: Boolean(checked) })} />
      </div>
    </div>
  );
}
