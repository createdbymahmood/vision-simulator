import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import { Camera, Grid, PenLine, PersonStanding, Pointer, Undo2, Redo2, Trash2, Upload, Play, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { CameraEntity, PersonEntity, SelectionKind, ShapeEntity, ShapeKind, Vector2, WallSegment } from "../../core/types";
import { snapToGrid } from "../../core/geometry";
import { PropertiesPanel } from "../shared/properties-panel";
import { useSceneStore, type SceneStore } from "../state/scene-store";

const PX_PER_METER = 60;
const GRID_MINOR = 1;
const GRID_MAJOR = 5;

interface CanvasEditorProps {
  onPreview: () => void;
}

interface DrawingShapeState {
  kind: ShapeKind;
  start: Vector2;
  current: Vector2;
}

function useStageSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const fallbackHeight = Math.max(640, typeof window !== "undefined" ? window.innerHeight - 240 : 700);
  const [size, setSize] = useState({ width: 1200, height: fallbackHeight });
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const width = containerRef.current?.clientWidth ?? size.width;
      const height = Math.max(640, typeof window !== "undefined" ? window.innerHeight - 240 : size.height);
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();
    const onResize = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, size.height, size.width]);

  return size;
}

function backgroundImageFromDataUrl(dataUrl?: string) {
  if (!dataUrl) return null;
  const img = new window.Image();
  img.src = dataUrl;
  return img;
}

export function CanvasEditor({ onPreview }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const size = useStageSize(containerRef);
  const { push } = useToast();

  const state = useSceneStore((store) => store);
  const [zoom, setZoom] = useState(1);
  const [stageOffset, setStageOffset] = useState({ x: size.width / 2, y: size.height / 2 });
  const [drawingWall, setDrawingWall] = useState<Vector2[]>([]);
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(null);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [hover, setHover] = useState<Vector2 | null>(null);
  const [invalidAction, setInvalidAction] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backgroundImage = useMemo(
    () => backgroundImageFromDataUrl(state.background?.imageDataUrl),
    [state.background?.imageDataUrl]
  );

  const worldPoint = useCallbackRef((_evt: KonvaEventObject<MouseEvent>): Vector2 => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    if (!point) return { x: 0, y: 0 };
    return {
      x: (point.x - stageOffset.x) / (PX_PER_METER * zoom),
      y: (point.y - stageOffset.y) / (PX_PER_METER * zoom),
    };
  });

  const toCanvas = useCallbackRef((point: Vector2) => {
    return {
      x: point.x * PX_PER_METER * zoom + stageOffset.x,
      y: point.y * PX_PER_METER * zoom + stageOffset.y,
    };
  });

  const handleWheel = (evt: KonvaEventObject<WheelEvent>) => {
    evt.evt.preventDefault();
    const delta = evt.evt.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const startPan = (clientX: number, clientY: number) => {
    setIsPanning(true);
    panStart.current = { x: clientX, y: clientY };
  };

  const onPanMove = (evt: KonvaEventObject<MouseEvent>) => {
    if (!isPanning || !panStart.current) return;
    const dx = evt.evt.clientX - panStart.current.x;
    const dy = evt.evt.clientY - panStart.current.y;
    panStart.current = { x: evt.evt.clientX, y: evt.evt.clientY };
    setStageOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const finishWallDrawing = useCallbackRef(() => {
    if (drawingWall.length < 2) return;
    for (let i = 0; i < drawingWall.length - 1; i++) {
      const start = drawingWall[i];
      const end = drawingWall[i + 1];
      if (start.x === end.x && start.y === end.y) continue;
      state.addWall(start, end);
    }
    setDrawingWall([]);
  });

  const onStageClick = (evt: KonvaEventObject<MouseEvent>) => {
    if (isPanning) return;
    const pointRaw = worldPoint(evt);
    const point = state.grid.snapToGrid ? snapToGrid(pointRaw, GRID_MINOR) : pointRaw;

    if (!state.selectionMode && state.activeTool === "select") return;

    if (state.activeTool === "wall") {
      setDrawingWall((prev) => [...prev, point]);
      return;
    }

    if (
      state.activeTool === "shape-rectangle" ||
      state.activeTool === "shape-circle" ||
      state.activeTool === "shape-triangle" ||
      state.activeTool === "shape-line"
    ) {
      setDrawingShape({ kind: state.activeTool.replace("shape-", "") as ShapeKind, start: point, current: point });
      return;
    }

    if (state.activeTool === "camera") {
      if (isBlocked(point, state)) {
        setInvalidAction("Camera cannot be inside walls/shapes");
        return;
      }
      state.addCamera(point, "basic");
      return;
    }

    if (state.activeTool === "person") {
      const colliding = state.people.some((person) => {
        const dist = Math.hypot(person.position.x - point.x, person.position.y - point.y);
        return dist < person.radius * 2;
      });
      const blocked = isBlocked(point, state);
      if (colliding || blocked) {
        setInvalidAction("Cannot place person overlapping another person");
        push({ title: "Invalid placement", description: "People cannot overlap." });
        return;
      }
      state.addPerson(point);
      return;
    }

    if (!state.selectionMode) return;

    const hit = hitTest(point, state);
    if (hit?.kind === "background" && state.activeTool !== "background") {
      state.setSelection(null);
      return;
    }
    state.setSelection(hit);
  };

  const onStageMouseMove = (evt: KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      onPanMove(evt);
      return;
    }
    const point = worldPoint(evt);
    setHover(point);
    if (drawingShape) {
      setDrawingShape({ ...drawingShape, current: point });
    }
  };

  const onStageDblClick = () => {
    if (state.activeTool === "wall") finishWallDrawing();
  };

  const endShape = () => {
    if (!drawingShape) return;
    const { kind, start, current } = drawingShape;
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);
    const center: Vector2 = { x: (start.x + current.x) / 2, y: (start.y + current.y) / 2 };
    const shape = state.grid.snapToGrid
      ? { x: snapToGrid(center, GRID_MINOR).x, y: snapToGrid(center, GRID_MINOR).y }
      : center;
    const overrides: any = {};
    if (kind === "rectangle" || kind === "triangle") {
      overrides.width = Math.max(0.1, width);
      overrides.length = Math.max(0.1, height);
    }
    if (kind === "circle") {
      overrides.radius = Math.max(width, height) / 2 || 1;
    }
    if (kind === "line") {
      overrides.length = Math.max(width, height) || 1;
      overrides.rotation = (Math.atan2(current.y - start.y, current.x - start.x) * 180) / Math.PI;
    }
    const id = state.addShape(kind, shape, overrides);
    state.setSelection({ kind: "shape", id });
    setDrawingShape(null);
  };

  useEffect(() => {
    const handler = (_event: MouseEvent) => {
      if (drawingShape) endShape();
      if (isPanning) {
        setIsPanning(false);
        panStart.current = null;
      }
    };
    window.addEventListener("mouseup", handler);
    return () => window.removeEventListener("mouseup", handler);
  });

  useEffect(() => {
    setStageOffset({ x: size.width / 2, y: size.height / 2 });
  }, [size.width, size.height]);

  useEffect(() => {
    if (!invalidAction) return;
    const timer = setTimeout(() => setInvalidAction(null), 1500);
    return () => clearTimeout(timer);
  }, [invalidAction]);

  useEffect(() => {
    if (state.activeTool !== "wall") {
      setDrawingWall([]);
    }
  }, [state.activeTool]);

  useEffect(() => {
    state.tick(0);
  }, [state.meta.updatedAt]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.setBackground({
        ...(state.background ?? { id: crypto.randomUUID(), opacity: 0.6, scale: 1, rotation: 0, position: { x: 0, y: 0 }, locked: false }),
        imageDataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const onClear = () => {
    const confirmed = window.confirm("Clear the board? This removes all objects.");
    if (confirmed) state.clearScene();
  };

  const exportTopDown = useCallbackRef(() => {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
    if (!uri) return;
    const link = document.createElement("a");
    link.href = uri;
    link.download = "scene.png";
    link.click();
    push({ title: "Snapshot saved", description: "Top-down PNG exported." });
  });

  return (
    <div className="flex h-full gap-3">
      <div className="flex w-full flex-col gap-3" ref={containerRef} style={{ minHeight: "70vh" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge variant={state.selectionMode ? "default" : "outline"}>Selection {state.selectionMode ? "On" : "Off"}</Badge>
            <Button variant="ghost" size="icon" onClick={() => state.setSelectionMode(!state.selectionMode)}>
              <Pointer className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <Grid className="h-4 w-4" />
              <span>Snap</span>
              <Switch checked={state.grid.snapToGrid} onChange={(e) => state.setGrid({ snapToGrid: e.target.checked })} />
              <span>Measure</span>
              <Switch
                checked={state.grid.measurementOverlay}
                onChange={(e) => state.setGrid({ measurementOverlay: e.target.checked })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => state.undo()}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => state.redo()}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={exportTopDown}>
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="gap-2" onClick={onPreview}>
              <Play className="h-4 w-4" /> Live Preview
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-[70vh] flex-1 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/60 to-card">
          <Stage
            ref={stageRef}
            width={Math.max(600, size.width - 20)}
            height={Math.max(520, size.height - 80)}
            scaleX={1}
            scaleY={1}
            onWheel={handleWheel}
            onMouseDown={(evt) => {
              if (evt.evt.button === 1 || evt.evt.shiftKey) {
                startPan(evt.evt.clientX, evt.evt.clientY);
                return;
              }
              onStageClick(evt as any);
            }}
            onMouseMove={onStageMouseMove}
            onDblClick={onStageDblClick}
            className={cn("cursor-crosshair", invalidAction ? "cursor-not-allowed" : "")}
          >
            <Layer listening={false}>
              {drawGrid(size.width, size.height, stageOffset, zoom)}
            </Layer>

            {state.background && backgroundImage ? (
              <Layer listening={!state.background.locked}>
                <KonvaImage
                  image={backgroundImage}
                  opacity={state.background.opacity}
                  x={toCanvas(state.background.position).x}
                  y={toCanvas(state.background.position).y}
                  scaleX={state.background.scale * zoom}
                  scaleY={state.background.scale * zoom}
                  rotation={state.background.rotation}
                />
              </Layer>
            ) : null}

            <Layer listening={state.selectionMode}>
              {state.shapes.map((shape) => renderShape(shape, toCanvas))}
              {state.walls.map((wall) => renderWall(wall, toCanvas))}
              {state.cameras.map((camera) => renderCamera(camera, toCanvas))}
              {state.people.map((person) => renderPerson(person, toCanvas, state.simulation.showTrails))}
            </Layer>

            <Layer listening={false}>
              {drawingWall.length ? (
                <Line
                  points={drawingWall.flatMap((pt) => {
                    const canvas = toCanvas(pt);
                    return [canvas.x, canvas.y];
                  })}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dash={[8, 6]}
                />
              ) : null}
              {drawingShape ? renderDrawingShape(drawingShape, toCanvas) : null}
              {state.grid.measurementOverlay && hover ? (
                <Text
                  text={`x ${hover.x.toFixed(2)}m | y ${hover.y.toFixed(2)}m`}
                  x={10}
                  y={10}
                  fill="#64748b"
                  fontSize={12}
                  fontFamily="Space Grotesk"
                />
              ) : null}
              {drawingWall.length && hover ? (
                <Text
                  text={`len ${Math.hypot(hover.x - drawingWall[drawingWall.length - 1].x, hover.y - drawingWall[drawingWall.length - 1].y).toFixed(2)}m • angle ${(
                    (Math.atan2(hover.y - drawingWall[drawingWall.length - 1].y, hover.x - drawingWall[drawingWall.length - 1].x) *
                      180) /
                    Math.PI
                  ).toFixed(0)}°`}
                  x={toCanvas(hover).x + 12}
                  y={toCanvas(hover).y - 12}
                  fill="#0ea5e9"
                  fontSize={12}
                  fontFamily="Space Grotesk"
                />
              ) : null}
              {invalidAction ? (
                <Text text={invalidAction} x={12} y={28} fill="#ef4444" fontSize={12} />
              ) : null}
            </Layer>
          </Stage>

          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-lg">
              <Button
                variant={state.activeTool === "select" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("select")}
              >
                <Pointer className="mr-1 h-4 w-4" /> Select
              </Button>
              <Button
                variant={state.activeTool === "wall" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("wall")}
              >
                <PenLine className="mr-1 h-4 w-4" /> Wall
              </Button>
              <Popover
                trigger={
                  <Button variant={state.activeTool.startsWith("shape") ? "default" : "ghost"} size="sm">
                    <Grid className="mr-1 h-4 w-4" /> Shape
                  </Button>
                }
                open={shapeMenuOpen}
                onOpenChange={setShapeMenuOpen}
                className="min-w-[180px]"
              >
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["Rectangle", "shape-rectangle"],
                    ["Circle", "shape-circle"],
                    ["Triangle", "shape-triangle"],
                    ["Line", "shape-line"],
                  ] as const).map(([label, tool]) => (
                    <Button
                      key={tool}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        state.setActiveTool(tool as any);
                        setShapeMenuOpen(false);
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </Popover>
              <Button
                variant={state.activeTool === "camera" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("camera")}
              >
                <Camera className="mr-1 h-4 w-4" /> Camera
              </Button>
              <Button
                variant={state.activeTool === "person" ? "default" : "ghost"}
                size="sm"
                onClick={() => state.setActiveTool("person")}
              >
                <PersonStanding className="mr-1 h-4 w-4" /> Person
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1 h-4 w-4" /> Background
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          </div>
        </div>
      </div>

      <PropertiesPanel selection={state.selected} />
    </div>
  );
}

function renderWall(wall: WallSegment, toCanvas: (point: Vector2) => { x: number; y: number }) {
  const start = toCanvas(wall.start);
  const end = toCanvas(wall.end);
  return (
    <Group key={wall.id}>
      <Line
        points={[start.x, start.y, end.x, end.y]}
        stroke={wall.color}
        strokeWidth={wall.thickness * PX_PER_METER}
        opacity={wall.opacity}
      />
    </Group>
  );
}

function renderShape(shape: ShapeEntity, toCanvas: (point: Vector2) => { x: number; y: number }) {
  const pos = toCanvas(shape.position);
  if (shape.shape === "rectangle") {
    return (
      <Rect
        key={shape.id}
        x={pos.x - (shape.width * PX_PER_METER) / 2}
        y={pos.y - (shape.length * PX_PER_METER) / 2}
        width={shape.width * PX_PER_METER}
        height={shape.length * PX_PER_METER}
        rotation={shape.rotation}
        fill={shape.color}
        opacity={shape.opacity}
        cornerRadius={8}
      />
    );
  }
  if (shape.shape === "circle") {
    return (
      <Circle
        key={shape.id}
        x={pos.x}
        y={pos.y}
        radius={(shape.radius ?? 1) * PX_PER_METER}
        fill={shape.color}
        opacity={shape.opacity}
      />
    );
  }
  if (shape.shape === "triangle") {
    const radius = (shape.width / 2) * PX_PER_METER;
    return (
      <Line
        key={shape.id}
        points={getTrianglePoints(pos, radius, shape.rotation ?? 0)}
        closed
        fill={shape.color}
        opacity={shape.opacity}
      />
    );
  }
  if (shape.shape === "line") {
    const len = shape.length * PX_PER_METER;
    const angle = shape.rotation ?? 0;
    const end = {
      x: pos.x + len * Math.cos((angle * Math.PI) / 180),
      y: pos.y + len * Math.sin((angle * Math.PI) / 180),
    };
    return (
      <Line
        key={shape.id}
        points={[pos.x, pos.y, end.x, end.y]}
        stroke={shape.color}
        strokeWidth={(shape.lineThickness ?? 0.1) * PX_PER_METER}
        opacity={shape.opacity}
      />
    );
  }
  return null;
}

function renderCamera(camera: CameraEntity, toCanvas: (point: Vector2) => { x: number; y: number }) {
  const pos = toCanvas(camera.position);
  const directionRad = (camera.direction * Math.PI) / 180;
  const coneLength = Math.min(camera.depth, 8) * PX_PER_METER;
  const leftAngle = directionRad - (camera.fov * Math.PI) / 360;
  const rightAngle = directionRad + (camera.fov * Math.PI) / 360;
  const conePoints = [
    pos.x,
    pos.y,
    pos.x + coneLength * Math.cos(leftAngle),
    pos.y + coneLength * Math.sin(leftAngle),
    pos.x + coneLength * Math.cos(rightAngle),
    pos.y + coneLength * Math.sin(rightAngle),
  ];

  const visionPoints = camera.visionPolygon?.length
    ? camera.visionPolygon.flatMap((pt: Vector2) => {
        const c = toCanvas(pt);
        return [c.x, c.y];
      })
    : null;

  return (
    <Group key={camera.id}>
      {visionPoints ? (
        <Line points={visionPoints} closed fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.45)" strokeWidth={1} />
      ) : (
        <Line points={conePoints} closed fill="rgba(14,165,233,0.05)" stroke="rgba(14,165,233,0.35)" strokeWidth={1} />
      )}
      <Circle x={pos.x} y={pos.y} radius={8} fill="#0ea5e9" opacity={0.9} />
    </Group>
  );
}

function renderPerson(person: PersonEntity, toCanvas: (point: Vector2) => { x: number; y: number }, showTrail: boolean) {
  const pos = toCanvas(person.position);
  return (
    <Group key={person.id}>
      {showTrail && person.trail?.length ? (
        <Line
          points={person.trail.flatMap((pt: Vector2) => {
            const c = toCanvas(pt);
            return [c.x, c.y];
          })}
          stroke="#22c55e"
          strokeWidth={2}
          opacity={0.6}
          tension={0.4}
        />
      ) : null}
      <Circle x={pos.x} y={pos.y} radius={person.radius * PX_PER_METER} fill="#22c55e" opacity={0.85} />
    </Group>
  );
}

function renderDrawingShape(drawing: DrawingShapeState, toCanvas: (point: Vector2) => { x: number; y: number }) {
  const start = toCanvas(drawing.start);
  const current = toCanvas(drawing.current);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);

  if (drawing.kind === "rectangle") {
    return <Rect x={x} y={y} width={width} height={height} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  if (drawing.kind === "circle") {
    const radius = Math.max(width, height) / 2;
    return <Circle x={(start.x + current.x) / 2} y={(start.y + current.y) / 2} radius={radius} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  if (drawing.kind === "line") {
    return <Line points={[start.x, start.y, current.x, current.y]} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  if (drawing.kind === "triangle") {
    return <Line points={[start.x, start.y, current.x, current.y, start.x, current.y]} stroke="#0ea5e9" dash={[6, 4]} strokeWidth={2} />;
  }
  return null;
}

function getTrianglePoints(pos: { x: number; y: number }, radius: number, rotation = 0) {
  const points = [] as number[];
  for (let i = 0; i < 3; i++) {
    const angle = (((i * 120 - 90) + rotation) * Math.PI) / 180;
    points.push(pos.x + radius * Math.cos(angle), pos.y + radius * Math.sin(angle));
  }
  return points;
}

function drawGrid(width: number, height: number, offset: { x: number; y: number }, zoom: number) {
  const lines = [] as JSX.Element[];
  const spacingMinor = PX_PER_METER * GRID_MINOR * zoom;
  const spacingMajor = PX_PER_METER * GRID_MAJOR * zoom;

  for (let x = offset.x % spacingMinor; x < width; x += spacingMinor) {
    lines.push(
      <Line key={`v-${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.45} />
    );
  }
  for (let y = offset.y % spacingMinor; y < height; y += spacingMinor) {
    lines.push(
      <Line key={`h-${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.45} />
    );
  }
  for (let x = offset.x % spacingMajor; x < width; x += spacingMajor) {
    lines.push(
      <Line key={`vm-${x}`} points={[x, 0, x, height]} stroke="#94a3b8" strokeWidth={1} opacity={0.45} />
    );
  }
  for (let y = offset.y % spacingMajor; y < height; y += spacingMajor) {
    lines.push(
      <Line key={`hm-${y}`} points={[0, y, width, y]} stroke="#94a3b8" strokeWidth={1} opacity={0.45} />
    );
  }

  return lines;
}

function pointSegmentDistance(point: Vector2, start: Vector2, end: Vector2) {
  const ap = { x: point.x - start.x, y: point.y - start.y };
  const ab = { x: end.x - start.x, y: end.y - start.y };
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y)));
  const closest = { x: start.x + ab.x * t, y: start.y + ab.y * t };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function isBlocked(point: Vector2, state: SceneStore) {
  const wallCollision = state.walls.some((wall) => pointSegmentDistance(point, wall.start, wall.end) < wall.thickness / 2 + 0.1);
  const shapeCollision = state.shapes.some((shape) => {
    if (!shape.blocksMovement) return false;
    if (shape.shape === "circle") {
      return Math.hypot(point.x - shape.position.x, point.y - shape.position.y) < (shape.radius ?? 1);
    }
    if (shape.shape === "rectangle") {
      const halfW = shape.width / 2;
      const halfL = shape.length / 2;
      return point.x >= shape.position.x - halfW && point.x <= shape.position.x + halfW && point.y >= shape.position.y - halfL && point.y <= shape.position.y + halfL;
    }
    if (shape.shape === "triangle") {
      const radius = shape.width / 2;
      const pts = [] as { x: number; y: number }[];
      for (let i = 0; i < 3; i++) {
        const angle = (((i * 120 - 90) + (shape.rotation ?? 0)) * Math.PI) / 180;
        pts.push({ x: shape.position.x + radius * Math.cos(angle), y: shape.position.y + radius * Math.sin(angle) });
      }
      return pointInTriangle(point, pts as any);
    }
    if (shape.shape === "line") {
      const len = shape.length;
      const angle = (shape.rotation ?? 0) * (Math.PI / 180);
      const end = { x: shape.position.x + len * Math.cos(angle), y: shape.position.y + len * Math.sin(angle) };
      return pointSegmentDistance(point, shape.position, end) < (shape.lineThickness ?? 0.1) / 2 + 0.05;
    }
    return false;
  });
  return wallCollision || shapeCollision;
}

function hitTest(point: Vector2, state: SceneStore): SelectionKind | null {
  const toPx = (pos: Vector2) => ({ x: pos.x * PX_PER_METER, y: pos.y * PX_PER_METER });
  const p = toPx(point);
  const people = state.people
    .map((person) => ({ person, dist: Math.hypot(p.x - person.position.x * PX_PER_METER, p.y - person.position.y * PX_PER_METER) }))
    .sort((a, b) => a.dist - b.dist);
  if (people.length && people[0].dist < people[0].person.radius * PX_PER_METER * 1.2) {
    return { kind: "person", id: people[0].person.id };
  }

  const cameraHit = state.cameras.find((camera) => {
    const dist = Math.hypot(p.x - camera.position.x * PX_PER_METER, p.y - camera.position.y * PX_PER_METER);
    return dist < 16;
  });
  if (cameraHit) return { kind: "camera", id: cameraHit.id };

  const wallHit = state.walls.find((wall) => {
    const start = toPx(wall.start);
    const end = toPx(wall.end);
    const a = { x: p.x - start.x, y: p.y - start.y };
    const b = { x: end.x - start.x, y: end.y - start.y };
    const t = Math.max(0, Math.min(1, (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y)));
    const proj = { x: start.x + b.x * t, y: start.y + b.y * t };
    const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
    return dist < wall.thickness * PX_PER_METER + 4;
  });
  if (wallHit) return { kind: "wall", id: wallHit.id };

  const shapeHit = state.shapes.find((shape) => {
    const pos = toPx(shape.position);
    if (shape.shape === "circle") {
      const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
      return dist < (shape.radius ?? 1) * PX_PER_METER;
    }
    if (shape.shape === "rectangle") {
      const halfW = (shape.width * PX_PER_METER) / 2;
      const halfL = (shape.length * PX_PER_METER) / 2;
      return p.x >= pos.x - halfW && p.x <= pos.x + halfW && p.y >= pos.y - halfL && p.y <= pos.y + halfL;
    }
    if (shape.shape === "triangle") {
      const radius = (shape.width / 2) * PX_PER_METER;
      const pts = [] as { x: number; y: number }[];
      for (let i = 0; i < 3; i++) {
        const angle = (((i * 120 - 90) + (shape.rotation ?? 0)) * Math.PI) / 180;
        pts.push({ x: pos.x + radius * Math.cos(angle), y: pos.y + radius * Math.sin(angle) });
      }
      return pointInTriangle({ x: p.x, y: p.y }, pts);
    }
    if (shape.shape === "line") {
      const len = shape.length * PX_PER_METER;
      const angle = (shape.rotation ?? 0) * (Math.PI / 180);
      const end = { x: pos.x + len * Math.cos(angle), y: pos.y + len * Math.sin(angle) };
      const a = { x: p.x - pos.x, y: p.y - pos.y };
      const b = { x: end.x - pos.x, y: end.y - pos.y };
      const t = Math.max(0, Math.min(1, (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y)));
      const proj = { x: pos.x + b.x * t, y: pos.y + b.y * t };
      const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
      return dist < (shape.lineThickness ?? 0.1) * PX_PER_METER + 4;
    }
    return false;
  });
  if (shapeHit) return { kind: "shape", id: shapeHit.id };

  if (state.background) return { kind: "background" };
  return null;
}

function pointInTriangle(p: { x: number; y: number }, [a, b, c]: { x: number; y: number }[]) {
  const area = (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2;
  const area1 = (p.x * (a.y - b.y) + a.x * (b.y - p.y) + b.x * (p.y - a.y)) / 2;
  const area2 = (p.x * (b.y - c.y) + b.x * (c.y - p.y) + c.x * (p.y - b.y)) / 2;
  const area3 = (p.x * (c.y - a.y) + c.x * (a.y - p.y) + a.x * (p.y - c.y)) / 2;
  return Math.abs(area) >= Math.abs(area1 + area2 + area3) - 0.1;
}
