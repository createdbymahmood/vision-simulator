import type { CameraEntity } from "@/domains/scene/core/types";
import { NumericField } from "./numeric-field";

interface CameraPropertiesProps {
  camera: CameraEntity;
  onChange: (patch: Partial<CameraEntity>) => void;
}

export function CameraProperties({ camera, onChange }: CameraPropertiesProps) {
  return (
    <div className="space-y-3">
      <NumericField
        label="X (m)"
        value={camera.position.x}
        onChange={(value) => onChange({ position: { ...camera.position, x: value } })}
      />
      <NumericField
        label="Y (m)"
        value={camera.position.y}
        onChange={(value) => onChange({ position: { ...camera.position, y: value } })}
      />
      <NumericField label="Height (m)" value={camera.height} min={0} onChange={(value) => onChange({ height: Math.max(0, value) })} />
      <NumericField
        label="Direction (deg)"
        value={camera.direction}
        min={0}
        max={360}
        onChange={(value) => onChange({ direction: value % 360 })}
      />
      <NumericField
        label="FOV (deg)"
        value={camera.fov}
        min={1}
        max={180}
        step={1}
        onChange={(value) => onChange({ fov: Math.min(180, Math.max(1, value)) })}
      />
      <NumericField
        label="Depth (m)"
        value={camera.depth}
        min={0.1}
        onChange={(value) => onChange({ depth: Math.max(0.1, value) })}
      />
      <NumericField label="Zoom" value={camera.zoom} min={0.1} onChange={(value) => onChange({ zoom: Math.max(0.1, value) })} />
    </div>
  );
}
