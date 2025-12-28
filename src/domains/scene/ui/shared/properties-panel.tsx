import { useMemo } from "react";
import { debounce } from "@lodash-es";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SelectionKind } from "../../core/types";
import { useSceneStore } from "../state/scene-store";

interface PropertiesPanelProps {
  selection: SelectionKind | null;
}

function NumericField({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
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

export function PropertiesPanel({ selection }: PropertiesPanelProps) {
  const state = useSceneStore((store) => store);

  const debouncedUpdateWall = useMemo(
    () => debounce((id: string, patch: any) => state.updateWall(id, patch), 250),
    [state]
  );
  const debouncedUpdateShape = useMemo(
    () => debounce((id: string, patch: any) => state.updateShape(id, patch), 250),
    [state]
  );
  const debouncedUpdateCamera = useMemo(
    () => debounce((id: string, patch: any) => state.updateCamera(id, patch), 250),
    [state]
  );
  const debouncedUpdatePerson = useMemo(
    () => debounce((id: string, patch: any) => state.updatePerson(id, patch), 250),
    [state]
  );
  const debouncedUpdateArea = useMemo(
    () => debounce((id: string, patch: any) => state.updateArea(id, patch), 250),
    [state]
  );

  const onDelete = useCallbackRef(() => {
    if (!selection) return;
    if (selection.kind === "wall") state.removeWall(selection.id);
    if (selection.kind === "shape") state.removeShape(selection.id);
    if (selection.kind === "camera") state.removeCamera(selection.id);
    if (selection.kind === "person") state.removePerson(selection.id);
    if (selection.kind === "area") state.removeArea(selection.id);
    if (selection.kind === "background") state.setBackground(undefined);
    state.setSelection(null);
  });

  if (!selection) return null;

  const wall = selection.kind === "wall" ? state.walls.find((w) => w.id === selection.id) : null;
  const shape = selection.kind === "shape" ? state.shapes.find((s) => s.id === selection.id) : null;
  const camera = selection.kind === "camera" ? state.cameras.find((c) => c.id === selection.id) : null;
  const person = selection.kind === "person" ? state.people.find((p) => p.id === selection.id) : null;
  const area = selection.kind === "area" ? state.areas.find((a) => a.id === selection.id) : null;
  const background = selection.kind === "background" ? state.background : null;

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Properties</p>
          <p className="text-sm font-semibold text-foreground">
            {selection.kind} {"id" in selection ? selection.id : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete selected">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {wall ? (
        <div className="space-y-3">
          <NumericField
            label="x1 (m)"
            value={wall.start.x}
            step={0.1}
            onChange={(value) => debouncedUpdateWall(wall.id, { start: { ...wall.start, x: value } })}
          />
          <NumericField
            label="y1 (m)"
            value={wall.start.y}
            step={0.1}
            onChange={(value) => debouncedUpdateWall(wall.id, { start: { ...wall.start, y: value } })}
          />
          <NumericField
            label="x2 (m)"
            value={wall.end.x}
            step={0.1}
            onChange={(value) => debouncedUpdateWall(wall.id, { end: { ...wall.end, x: value } })}
          />
          <NumericField
            label="y2 (m)"
            value={wall.end.y}
            step={0.1}
            onChange={(value) => debouncedUpdateWall(wall.id, { end: { ...wall.end, y: value } })}
          />
          <NumericField
            label="Height (m)"
            min={0}
            value={wall.height}
            onChange={(value) => debouncedUpdateWall(wall.id, { height: Math.max(0, value) })}
          />
          <NumericField
            label="Thickness (m)"
            min={0.05}
            step={0.05}
            value={wall.thickness}
            onChange={(value) => debouncedUpdateWall(wall.id, { thickness: Math.max(0.05, value) })}
          />
          <div className="flex items-center gap-2">
            <Label>Color</Label>
            <input
              type="color"
              value={wall.color}
              onChange={(event) => debouncedUpdateWall(wall.id, { color: event.target.value })}
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
            />
          </div>
          <div>
            <Label>Opacity</Label>
            <Slider
              value={wall.opacity}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(value) => debouncedUpdateWall(wall.id, { opacity: value })}
            />
          </div>
        </div>
      ) : null}

      {shape ? (
        <div className="space-y-3">
          <NumericField
            label="X (m)"
            value={shape.position.x}
            onChange={(value) => debouncedUpdateShape(shape.id, { position: { ...shape.position, x: value } })}
          />
          <NumericField
            label="Y (m)"
            value={shape.position.y}
            onChange={(value) => debouncedUpdateShape(shape.id, { position: { ...shape.position, y: value } })}
          />
          <NumericField
            label="Rotation (deg)"
            value={shape.rotation}
            onChange={(value) => debouncedUpdateShape(shape.id, { rotation: value % 360 })}
          />
          <NumericField
            label="Width (m)"
            value={shape.width}
            min={0.1}
            onChange={(value) => debouncedUpdateShape(shape.id, { width: Math.max(0.1, value) })}
          />
          <NumericField
            label="Length (m)"
            value={shape.length}
            min={0.1}
            onChange={(value) => debouncedUpdateShape(shape.id, { length: Math.max(0.1, value) })}
          />
          <NumericField
            label="Height (m)"
            value={shape.height}
            min={0}
            onChange={(value) => debouncedUpdateShape(shape.id, { height: Math.max(0, value) })}
          />
          {shape.shape === "circle" ? (
            <NumericField
              label="Radius (m)"
              value={shape.radius ?? 1}
              min={0.1}
              onChange={(value) => debouncedUpdateShape(shape.id, { radius: Math.max(0.1, value) })}
            />
          ) : null}
          {shape.shape === "line" ? (
            <NumericField
              label="Thickness (m)"
              value={shape.lineThickness ?? 0.1}
              min={0.05}
              onChange={(value) => debouncedUpdateShape(shape.id, { lineThickness: Math.max(0.05, value) })}
            />
          ) : null}
          <div className="flex items-center gap-2">
            <Label>Blocks vision</Label>
            <Switch
              checked={shape.blocksVision}
              onChange={(event) => debouncedUpdateShape(shape.id, { blocksVision: event.target.checked })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>Blocks movement</Label>
            <Switch
              checked={shape.blocksMovement}
              onChange={(event) => debouncedUpdateShape(shape.id, { blocksMovement: event.target.checked })}
            />
          </div>
        </div>
      ) : null}

      {camera ? (
        <div className="space-y-3">
          <NumericField
            label="X (m)"
            value={camera.position.x}
            onChange={(value) => debouncedUpdateCamera(camera.id, { position: { ...camera.position, x: value } })}
          />
          <NumericField
            label="Y (m)"
            value={camera.position.y}
            onChange={(value) => debouncedUpdateCamera(camera.id, { position: { ...camera.position, y: value } })}
          />
          <NumericField
            label="Height (m)"
            value={camera.height}
            min={0}
            onChange={(value) => debouncedUpdateCamera(camera.id, { height: Math.max(0, value) })}
          />
          <NumericField
            label="Direction (deg)"
            value={camera.direction}
            min={0}
            max={360}
            onChange={(value) => debouncedUpdateCamera(camera.id, { direction: value % 360 })}
          />
          <NumericField
            label="FOV (deg)"
            value={camera.fov}
            min={1}
            max={180}
            step={1}
            onChange={(value) => debouncedUpdateCamera(camera.id, { fov: Math.min(180, Math.max(1, value)) })}
          />
          <NumericField
            label="Depth (m)"
            value={camera.depth}
            min={0.1}
            onChange={(value) => debouncedUpdateCamera(camera.id, { depth: Math.max(0.1, value) })}
          />
          <NumericField
            label="Zoom"
            value={camera.zoom}
            min={0.1}
            onChange={(value) => debouncedUpdateCamera(camera.id, { zoom: Math.max(0.1, value) })}
          />
        </div>
      ) : null}

      {person ? (
        <div className="space-y-3">
          <NumericField
            label="X (m)"
            value={person.position.x}
            onChange={(value) => debouncedUpdatePerson(person.id, { position: { ...person.position, x: value } })}
          />
          <NumericField
            label="Y (m)"
            value={person.position.y}
            onChange={(value) => debouncedUpdatePerson(person.id, { position: { ...person.position, y: value } })}
          />
          <NumericField
            label="Speed (m/s)"
            value={person.speed}
            min={0}
            onChange={(value) => debouncedUpdatePerson(person.id, { speed: Math.max(0, value) })}
          />
          <NumericField
            label="Radius (m)"
            value={person.radius}
            min={0.1}
            onChange={(value) => debouncedUpdatePerson(person.id, { radius: Math.max(0.1, value) })}
          />
          <div className="flex items-center gap-2">
            <Label>Trail</Label>
            <Switch
              checked={person.trailEnabled}
              onChange={(event) => debouncedUpdatePerson(person.id, { trailEnabled: event.target.checked })}
            />
          </div>
        </div>
      ) : null}

      {area ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={area.name}
              onChange={(event) => debouncedUpdateArea(area.id, { name: event.target.value })}
            />
          </div>
          <NumericField
            label="Points"
            value={area.pointCount}
            onChange={(value) => debouncedUpdateArea(area.id, { pointCount: value })}
          />
          <p className="text-xs text-muted-foreground">Active area bounds locked to drawn geometry.</p>
        </div>
      ) : null}

      {background ? (
        <div className="space-y-3">
          <NumericField
            label="Opacity"
            value={background.opacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(value) => state.setBackground({ ...background, opacity: value })}
          />
          <NumericField
            label="Scale"
            value={background.scale}
            min={0.1}
            step={0.1}
            onChange={(value) => state.setBackground({ ...background, scale: value })}
          />
          <NumericField
            label="Rotation"
            value={background.rotation}
            step={1}
            onChange={(value) => state.setBackground({ ...background, rotation: value })}
          />
          <div className="flex items-center gap-2">
            <Label>Locked</Label>
            <Switch
              checked={background.locked}
              onChange={(event) => state.setBackground({ ...background, locked: event.target.checked })}
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
