import type { MutableRefObject } from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import {
  ArrowLeftRightIcon,
  CameraIcon,
  CheckCircle2Icon,
  CircleIcon,
  DownloadIcon,
  EraserIcon,
  GridIcon,
  MousePointer2Icon,
  PlayIcon,
  RedoIcon,
  RulerIcon,
  ShapesIcon,
  TriangleIcon,
  UndoIcon,
  UserRoundIcon,
  WallpaperIcon,
} from "lucide-react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  Circle,
  Group,
  Layer,
  Line,
  Rect,
  RegularPolygon,
  Stage,
  Transformer,
} from "react-konva";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  SceneArea,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneShapeKind,
  SceneTool,
  SceneWall,
} from "../core/scene-types";
import { useSceneHistoryStore } from "./scene-history-store";
import { useSceneStore } from "./scene-store";

type Point = { x: number; y: number };

interface DrawingWallState {
  anchors: Point[];
  preview: Point | null;
}

interface DrawingShapeState {
  start: Point;
  current: Point;
  kind: SceneShapeKind;
}

const GRID_SIZE = 48; // pixels per meter
const MIN_SEGMENT_LENGTH = 0.05;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

function useElementSize<T extends HTMLElement>(): [
  MutableRefObject<T | null>,
  { width: number; height: number }
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function toCanvas(point: Point, offset: Point, scale: number): Point {
  return {
    x: offset.x + point.x * GRID_SIZE * scale,
    y: offset.y + point.y * GRID_SIZE * scale,
  };
}

function lengthBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return Math.round(angle * 10) / 10;
}

function snapPoint(point: Point, enabled: boolean): Point {
  if (!enabled) {
    return point;
  }
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

function pointFromStage(
  stage: Konva.Stage | null,
  offset: Point,
  scale: number
): Point | null {
  if (!stage) {
    return null;
  }
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }
  return {
    x: (pointer.x - offset.x) / (GRID_SIZE * scale),
    y: (pointer.y - offset.y) / (GRID_SIZE * scale),
  };
}

function CanvasGrid({
  width,
  height,
  offset,
  scale,
}: {
  width: number;
  height: number;
  offset: Point;
  scale: number;
}) {
  const cell = GRID_SIZE;
  const left = (0 - offset.x) / (cell * scale);
  const right = (width - offset.x) / (cell * scale);
  const top = (0 - offset.y) / (cell * scale);
  const bottom = (height - offset.y) / (cell * scale);

  const verticalLines: number[] = [];
  const horizontalLines: number[] = [];

  for (let x = Math.floor(left); x <= Math.ceil(right); x += 1) {
    verticalLines.push(x * cell);
  }
  for (let y = Math.floor(top); y <= Math.ceil(bottom); y += 1) {
    horizontalLines.push(y * cell);
  }

  return (
    <Layer listening={false}>
      {verticalLines.map((x) => (
        <Line
          key={`v-${x}`}
          points={[x, top * cell, x, bottom * cell]}
          stroke="#e2e8f0"
          strokeWidth={1 / scale}
        />
      ))}
      {horizontalLines.map((y) => (
        <Line
          key={`h-${y}`}
          points={[left * cell, y, right * cell, y]}
          stroke="#e2e8f0"
          strokeWidth={1 / scale}
        />
      ))}
      <Line
        points={[0, top * cell, 0, bottom * cell]}
        stroke="#cbd5e1"
        strokeWidth={1.5 / scale}
      />
      <Line
        points={[left * cell, 0, right * cell, 0]}
        stroke="#cbd5e1"
        strokeWidth={1.5 / scale}
      />
    </Layer>
  );
}

function WallSegment({
  wall,
  scale,
  isSelected,
  onSelect,
}: {
  wall: SceneWall;
  scale: number;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Line
      points={[
        wall.coordinates.x1 * GRID_SIZE,
        wall.coordinates.y1 * GRID_SIZE,
        wall.coordinates.x2 * GRID_SIZE,
        wall.coordinates.y2 * GRID_SIZE,
      ]}
      stroke={wall.color}
      strokeWidth={Math.max(2, wall.thickness * GRID_SIZE) / scale}
      opacity={wall.opacity}
      onClick={onSelect}
      onTap={onSelect}
      dash={isSelected ? [6, 4] : undefined}
      strokeEnabled
      lineCap="round"
      lineJoin="round"
      listening
    />
  );
}

function ShapeNode({
  shape,
  isSelected,
  scale,
  onSelect,
  onTransform,
}: {
  shape: SceneShape;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onTransform: (next: Partial<SceneShape>) => void;
}) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (!transformerRef.current) {
      return;
    }
    if (isSelected && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected]);

  const commonProps = {
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    opacity: shape.opacity,
    ref: shapeRef,
  };

  const strokeWidth = Math.max(1.5, shape.lineThickness * GRID_SIZE) / scale;
  const fill = shape.color;

  const transformer = isSelected ? (
    <Transformer
      ref={transformerRef}
      rotateEnabled
      resizeEnabled
      borderDash={[6, 4]}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < GRID_SIZE * 0.2 || newBox.height < GRID_SIZE * 0.2) {
          return oldBox;
        }
        return newBox;
      }}
    />
  ) : null;

  if (shape.type === "rectangle") {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          onDragEnd={(event) => {
            onTransform({
              x: event.target.x() / GRID_SIZE,
              y: event.target.y() / GRID_SIZE,
            });
          }}
          onTransformEnd={(event) => {
            const node = event.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onTransform({
              width: shape.width * scaleX,
              length: shape.length * scaleY,
              rotation: (node.rotation() * Math.PI) / 180,
            });
          }}
        >
          <Rect
            width={shape.width * GRID_SIZE}
            height={shape.length * GRID_SIZE}
            fill={fill}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <Rect
              width={shape.width * GRID_SIZE}
              height={shape.length * GRID_SIZE}
              stroke="#38bdf8"
              strokeWidth={1.5 / scale}
              dash={[6, 4]}
            />
          )}
        </Group>
        {transformer}
      </>
    );
  }

  if (shape.type === "circle") {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          {...commonProps}
          onDragEnd={(event) => {
            onTransform({
              x: event.target.x() / GRID_SIZE,
              y: event.target.y() / GRID_SIZE,
            });
          }}
          onTransformEnd={(event) => {
            const node = event.target;
            const scaleX = node.scaleX();
            node.scaleX(1);
            node.scaleY(1);
            onTransform({
              width: shape.width * scaleX,
              length: shape.length * scaleX,
              rotation: 0,
            });
          }}
        >
          <Circle
            radius={(shape.width * GRID_SIZE) / 2}
            fill={fill}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <Circle
              radius={(shape.width * GRID_SIZE) / 2 + 4}
              stroke="#38bdf8"
              strokeWidth={1.5 / scale}
              dash={[6, 4]}
            />
          )}
        </Group>
        {transformer}
      </>
    );
  }

  if (shape.type === "triangle") {
    return (
      <>
        <Group
          x={shape.x * GRID_SIZE}
          y={shape.y * GRID_SIZE}
          rotation={(shape.rotation * 180) / Math.PI}
          {...commonProps}
          onDragEnd={(event) => {
            onTransform({
              x: event.target.x() / GRID_SIZE,
              y: event.target.y() / GRID_SIZE,
            });
          }}
          onTransformEnd={(event) => {
            const node = event.target;
            const scaleX = node.scaleX();
            node.scaleX(1);
            node.scaleY(1);
            onTransform({
              width: shape.width * scaleX,
              length: shape.length * scaleX,
              rotation: (node.rotation() * Math.PI) / 180,
            });
          }}
        >
          <RegularPolygon
            sides={3}
            radius={(shape.width * GRID_SIZE) / 2}
            fill={fill}
            stroke={fill}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <RegularPolygon
              sides={3}
              radius={(shape.width * GRID_SIZE) / 2 + 6}
              stroke="#38bdf8"
              strokeWidth={1.5 / scale}
              dash={[6, 4]}
            />
          )}
        </Group>
        {transformer}
      </>
    );
  }

  return (
    <>
      <Line
        ref={shapeRef}
        points={[
          shape.x * GRID_SIZE,
          shape.y * GRID_SIZE,
          (shape.x + shape.width) * GRID_SIZE,
          (shape.y + shape.length) * GRID_SIZE,
        ]}
        stroke={fill}
        strokeWidth={strokeWidth}
        lineCap="round"
        opacity={shape.opacity}
        onClick={onSelect}
        onTap={onSelect}
        draggable
        onDragEnd={(event) => {
          const target = event.target as any;
          onTransform({
            x: target.points()[0] / GRID_SIZE,
            y: target.points()[1] / GRID_SIZE,
          });
        }}
        onTransformEnd={(event) => {
          const node = event.target as any;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onTransform({
            width: shape.width * scaleX,
            length: shape.length * scaleY,
            rotation: (node.rotation() * Math.PI) / 180,
          });
        }}
      />
      {transformer}
    </>
  );
}

function CameraNode({ camera }: { camera: SceneCamera }) {
  return (
    <RegularPolygon
      x={camera.x * GRID_SIZE}
      y={camera.y * GRID_SIZE}
      sides={3}
      radius={12}
      rotation={camera.direction}
      fill="#0f172a"
      opacity={0.8}
    />
  );
}

function PersonNode({ person }: { person: ScenePerson }) {
  return (
    <Circle
      x={person.x * GRID_SIZE}
      y={person.y * GRID_SIZE}
      radius={person.radius * GRID_SIZE}
      fill="#22c55e"
      opacity={0.85}
    />
  );
}

function AreaNode({ area }: { area: SceneArea }) {
  const first = area.geometry[0];
  if (!first) {
    return null;
  }
  const points = area.geometry.flatMap((p) => [p.lng * GRID_SIZE, p.lat * GRID_SIZE]);
  return (
    <Line
      points={points}
      closed
      stroke="#f59e0b"
      strokeWidth={2}
      dash={[6, 4]}
      opacity={0.8}
    />
  );
}

export function CanvasEditor() {
  const [boardRef, boardSize] = useElementSize<HTMLDivElement>();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [shapeTool, setShapeTool] = useState<SceneShapeKind>("rectangle");
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null);
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const scene = useSceneStore((state) => state.scene);
  const selection = useSceneStore((state) => state.selection);
  const activeTool = useSceneStore((state) => state.activeTool);
  const selectEntity = useSceneStore((state) => state.selectEntity);
  const setActiveTool = useSceneStore((state) => state.setActiveTool);
  const setSceneMode = useSceneStore((state) => state.setSceneMode);
  const setSceneBackground = useSceneStore((state) => state.setSceneBackground);
  const closeOverlays = useSceneStore((state) => state.closeOverlays);
  const addWall = useSceneStore((state) => state.addWall);
  const addShape = useSceneStore((state) => state.addShape);
  const updateShape = useSceneStore((state) => state.updateShape);
  const addCamera = useSceneStore((state) => state.addCamera);
  const addPerson = useSceneStore((state) => state.addPerson);
  const resetScene = useSceneStore((state) => state.resetScene);
  const hydrateScene = useSceneStore((state) => state.hydrateScene);
  const setActivePopover = useSceneStore((state) => state.setActivePopover);
  const toggleSelectionMode = useSceneStore((state) => state.toggleSelectionMode);

  const captureSnapshot = useSceneHistoryStore((state) => state.captureSnapshot);
  const undoSnapshot = useSceneHistoryStore((state) => state.undo);
  const redoSnapshot = useSceneHistoryStore((state) => state.redo);
  const clearHistory = useSceneHistoryStore((state) => state.clearHistory);
  const historyPast = useSceneHistoryStore((state) => state.past);
  const historyFuture = useSceneHistoryStore((state) => state.future);

  useEffect(() => {
    setSceneMode("canvas");
  }, [setSceneMode]);

  useEffect(() => {
    if (boardSize.width && boardSize.height) {
      setOffset({
        x: boardSize.width / 2,
        y: boardSize.height / 2,
      });
    }
  }, [boardSize.height, boardSize.width]);

  const cursor = useMemo(() => {
    if (!editMode) {
      return "not-allowed";
    }
    if (activeTool === "wall" || activeTool === "shape") {
      return "crosshair";
    }
    return "default";
  }, [activeTool, editMode]);

  const handleZoom = useCallbackRef((event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const zoomAmount = 0.1 * direction;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + zoomAmount));

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      setScale(newScale);
      return;
    }

    const mousePointTo = {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };

    setScale(newScale);
    setOffset({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  });

  const handleDragMove = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    setOffset({
      x: event.target.x(),
      y: event.target.y(),
    });
  });

  const finishWall = useCallbackRef((anchors: Point[]) => {
    if (anchors.length < 2) {
      setDrawingWall(null);
      return;
    }
    captureSnapshot(scene);
    for (let i = 0; i < anchors.length - 1; i += 1) {
      const start = anchors[i];
      const end = anchors[i + 1];
      if (lengthBetween(start, end) < MIN_SEGMENT_LENGTH) {
        continue;
      }
      addWall({
        id: crypto.randomUUID(),
        type: "wall",
        coordinates: {
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
        },
        height: 3,
        thickness: 0.2,
        color: "#0f172a",
        opacity: 0.9,
      });
    }
    setDrawingWall(null);
  });

  const finishShape = useCallbackRef(
    (start: Point, current: Point, kind: SceneShapeKind) => {
      const width = Math.abs(current.x - start.x) || 1;
      const length = Math.abs(current.y - start.y) || 1;
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);

      captureSnapshot(scene);
      const defaultShape: SceneShape = {
        id: crypto.randomUUID(),
        type: kind,
        x,
        y,
        rotation: 0,
        width: width || 1,
        length: length || 1,
        height: 0.1,
        color: "#0f172a",
        opacity: 0.75,
        lineThickness: 0.05,
      };

      if (kind === "line") {
        defaultShape.length = current.y - start.y;
        defaultShape.width = current.x - start.x;
      }

      addShape(defaultShape);
      selectEntity({ id: defaultShape.id, kind: "shape" });
      setDrawingShape(null);
    }
  );

  const handleStagePointerDown = useCallbackRef(
    (event: KonvaEventObject<PointerEvent>) => {
      if (!editMode) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const point = pointFromStage(stage, offset, scale);
      if (!point) {
        return;
      }
      const snapped = snapPoint(point, snapEnabled);

      if (activeTool === "wall") {
        if (!drawingWall) {
          setDrawingWall({ anchors: [snapped], preview: snapped });
        } else {
          const lastAnchor =
            drawingWall.anchors[drawingWall.anchors.length - 1];
          if (lengthBetween(lastAnchor, snapped) < MIN_SEGMENT_LENGTH) {
            return;
          }
          setDrawingWall({
            anchors: [...drawingWall.anchors, snapped],
            preview: snapped,
          });
        }
        return;
      }

      if (activeTool === "shape") {
        setDrawingShape({ start: snapped, current: snapped, kind: shapeTool });
        return;
      }

      if (activeTool === "camera") {
        captureSnapshot(scene);
        const camera: SceneCamera = {
          id: crypto.randomUUID(),
          typePreset: "fixed",
          x: snapped.x,
          y: snapped.y,
          height: 2.5,
          direction: 45,
          fov: 90,
          depth: 12,
          zoom: 1,
          resolution: "1080p",
          nearPlane: 0.2,
        };
        addCamera(camera);
        selectEntity({ id: camera.id, kind: "camera" });
        return;
      }

      if (activeTool === "person") {
        captureSnapshot(scene);
        const person: ScenePerson = {
          id: crypto.randomUUID(),
          x: snapped.x,
          y: snapped.y,
          radius: 0.3,
          height: 1.75,
          speed: 1.2,
          behavior: "idle",
          trailEnabled: false,
        };
        addPerson(person);
        selectEntity({ id: person.id, kind: "person" });
        return;
      }

      if (event.target === stage) {
        selectEntity(null);
        closeOverlays();
      }
    }
  );

  const handleStagePointerMove = useCallbackRef(() => {
    if (!drawingWall && !drawingShape) {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const point = pointFromStage(stage, offset, scale);
    if (!point) {
      return;
    }
    const snapped = snapPoint(point, snapEnabled);
    if (drawingWall) {
      setDrawingWall({
        anchors: drawingWall.anchors,
        preview: snapped,
      });
    }
    if (drawingShape) {
      setDrawingShape({
        ...drawingShape,
        current: snapped,
      });
    }
  });

  const handleStagePointerUp = useCallbackRef(() => {
    if (drawingShape) {
      finishShape(drawingShape.start, drawingShape.current, drawingShape.kind);
    }
  });

  const handleStageDoubleClick = useCallbackRef(() => {
    if (drawingWall) {
      finishWall(drawingWall.anchors);
    }
  });

  const handleClearBoard = useCallbackRef(() => {
    clearHistory();
    resetScene();
    setClearDialogOpen(false);
  });

  const handleUndo = useCallbackRef(() => {
    const previous = undoSnapshot(scene);
    if (previous) {
      hydrateScene(previous);
    }
  });

  const handleRedo = useCallbackRef(() => {
    const next = redoSnapshot(scene);
    if (next) {
      hydrateScene(next);
    }
  });

  const handleExport = useCallbackRef(() => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scene-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const handleBackgroundImage = useCallbackRef(() => {
    const url = window.prompt("Enter background image URL");
    if (!url) {
      return;
    }
    captureSnapshot(scene);
    setSceneBackground({
      type: "image",
      value: url,
      opacity: 0.4,
    });
  });

  const measurement = useMemo(() => {
    if (!drawingWall || !drawingWall.preview || !drawingWall.anchors.length) {
      return null;
    }
    const lastAnchor = drawingWall.anchors[drawingWall.anchors.length - 1];
    const current = drawingWall.preview;
    const length = lengthBetween(lastAnchor, current);
    const angle = angleBetween(lastAnchor, current);
    const screen = toCanvas(current, offset, scale);
    return {
      length,
      angle,
      screen,
    };
  }, [drawingWall, offset, scale]);

  const drawingWallPreview = useMemo(() => {
    if (!drawingWall) {
      return null;
    }
    const pointsArray = [...drawingWall.anchors];
    if (drawingWall.preview) {
      pointsArray.push(drawingWall.preview);
    }
    const points = pointsArray.flatMap((p) => [p.x * GRID_SIZE, p.y * GRID_SIZE]);
    return points;
  }, [drawingWall]);

  const activeShapeKindLabel = useMemo(() => {
    if (shapeTool === "rectangle") return "Rectangle";
    if (shapeTool === "circle") return "Circle";
    if (shapeTool === "triangle") return "Triangle";
    return "Line";
  }, [shapeTool]);

  const activeToolLabel = useMemo(() => {
    if (activeTool === "select") return "Selection";
    if (activeTool === "wall") return "Draw wall";
    if (activeTool === "shape") return `Draw ${activeShapeKindLabel}`;
    if (activeTool === "camera") return "Place camera";
    if (activeTool === "person") return "Place person";
    if (activeTool === "area") return "Add area";
    return "Tool";
  }, [activeShapeKindLabel, activeTool]);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="sticky top-16 z-20 flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Canvas Editor</Badge>
          <Badge>Top Panel</Badge>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Switch
            checked={editMode}
            onCheckedChange={setEditMode}
            id="edit-mode"
          />
          <label htmlFor="edit-mode" className="text-sm">
            Edit mode
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={snapEnabled}
            onCheckedChange={setSnapEnabled}
            id="snap-grid"
          />
          <label htmlFor="snap-grid" className="text-sm">
            Snap to grid
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setClearDialogOpen(true)}
          >
            <EraserIcon className="mr-2 size-4" />
            Clear board
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={!historyPast.length}
          >
            <UndoIcon className="mr-2 size-4" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRedo}
            disabled={!historyFuture.length}
          >
            <RedoIcon className="mr-2 size-4" />
            Redo
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
          <Button size="sm" variant="default" onClick={() => alert("Live preview not implemented yet")}>
            <PlayIcon className="mr-2 size-4" />
            Live Preview
          </Button>
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative flex min-h-[640px] flex-1 overflow-hidden rounded-xl border bg-white shadow-sm"
        style={{ cursor }}
      >
        {scene.background?.type === "image" && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${scene.background.value})` }}
          />
        )}
        <Stage
          ref={stageRef}
          width={boardSize.width}
          height={boardSize.height}
          x={offset.x}
          y={offset.y}
          scaleX={scale}
          scaleY={scale}
          draggable={activeTool === "select" && !drawingWall && !drawingShape}
          onDragMove={handleDragMove}
          onWheel={handleZoom}
          onMouseDown={handleStagePointerDown}
          onMouseMove={handleStagePointerMove}
          onMouseUp={handleStagePointerUp}
          onDblClick={handleStageDoubleClick}
        >
          <CanvasGrid width={boardSize.width} height={boardSize.height} offset={offset} scale={scale} />
          <Layer listening={false}>
            <Rect
              x={(boardSize.width / 2 - offset.x) / scale}
              y={(boardSize.height / 2 - offset.y) / scale}
              width={8}
              height={8}
              fill="#0ea5e9"
            />
          </Layer>
          <Layer>
            {scene.walls.map((wall) => (
              <WallSegment
                key={wall.id}
                wall={wall}
                scale={scale}
                isSelected={
                  selection.selectedEntityId === wall.id &&
                  selection.selectedEntityKind === "wall"
                }
                onSelect={() => selectEntity({ id: wall.id, kind: "wall" })}
              />
            ))}
            {drawingWallPreview && (
              <Line
                points={drawingWallPreview}
                stroke="#0ea5e9"
                strokeWidth={2 / scale}
                dash={[6, 4]}
              />
            )}
            {scene.shapes.map((shape) => (
              <ShapeNode
                key={shape.id}
                shape={shape}
                scale={scale}
                isSelected={
                  selection.selectedEntityId === shape.id &&
                  selection.selectedEntityKind === "shape"
                }
                onSelect={() => selectEntity({ id: shape.id, kind: "shape" })}
                onTransform={(next) => updateShape(shape.id, next)}
              />
            ))}
            {drawingShape && (
              <ShapeNode
                shape={{
                  id: "preview",
                  type: drawingShape.kind,
                  x: Math.min(drawingShape.start.x, drawingShape.current.x),
                  y: Math.min(drawingShape.start.y, drawingShape.current.y),
                  rotation: 0,
                  width: Math.abs(drawingShape.current.x - drawingShape.start.x),
                  length: Math.abs(drawingShape.current.y - drawingShape.start.y),
                  height: 0.1,
                  color: "#0ea5e9",
                  opacity: 0.4,
                  lineThickness: 0.05,
                }}
                scale={scale}
                isSelected={false}
                onSelect={() => {}}
                onTransform={() => {}}
              />
            )}
            {scene.cameras.map((camera) => (
              <CameraNode key={camera.id} camera={camera} />
            ))}
            {scene.people.map((person) => (
              <PersonNode key={person.id} person={person} />
            ))}
            {scene.areas.map((area) => (
              <AreaNode key={area.id} area={area} />
            ))}
          </Layer>
        </Stage>

        {measurement && (
          <div
            className="pointer-events-none absolute rounded-md border bg-white/90 px-3 py-2 text-xs shadow-sm"
            style={{
              left: measurement.screen.x + 12,
              top: measurement.screen.y + 12,
            }}
          >
            <div className="flex items-center gap-2">
              <RulerIcon className="size-3.5" />
              <span>{measurement.length.toFixed(2)} m</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowLeftRightIcon className="size-3.5" />
              <span>{measurement.angle.toFixed(1)}°</span>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
        <div className="flex w-full max-w-5xl items-center gap-4 rounded-full border bg-background/95 px-4 py-3 shadow-md backdrop-blur">
          <div className="flex items-center gap-2">
            <Switch
              checked={selection.mode === "multi"}
              onCheckedChange={() => toggleSelectionMode()}
              id="selection-mode"
            />
            <label htmlFor="selection-mode" className="text-sm">
              Selection mode
            </label>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={(value) => {
              if (!value) return;
              setActiveTool(value as SceneTool);
              setActivePopover(null);
            }}
            spacing={4}
          >
            <ToggleGroupItem value="select" aria-label="Select tool">
              <MousePointer2Icon className="size-4" />
              Select
            </ToggleGroupItem>
            <ToggleGroupItem value="wall" aria-label="Draw wall tool">
              <GridIcon className="size-4" />
              Wall
            </ToggleGroupItem>
            <Popover>
              <PopoverTrigger asChild>
                <ToggleGroupItem value="shape" aria-label="Draw shapes">
                  <ShapesIcon className="size-4" />
                  {activeShapeKindLabel}
                </ToggleGroupItem>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="flex flex-col gap-2">
                  <Button
                    variant={shapeTool === "rectangle" ? "default" : "outline"}
                    onClick={() => {
                      setShapeTool("rectangle");
                      setActiveTool("shape");
                    }}
                    size="sm"
                  >
                    <CheckCircle2Icon className="mr-2 size-4" />
                    Rectangle
                  </Button>
                  <Button
                    variant={shapeTool === "circle" ? "default" : "outline"}
                    onClick={() => {
                      setShapeTool("circle");
                      setActiveTool("shape");
                    }}
                    size="sm"
                  >
                    <CircleIcon className="mr-2 size-4" />
                    Circle
                  </Button>
                  <Button
                    variant={shapeTool === "triangle" ? "default" : "outline"}
                    onClick={() => {
                      setShapeTool("triangle");
                      setActiveTool("shape");
                    }}
                    size="sm"
                  >
                    <TriangleIcon className="mr-2 size-4" />
                    Triangle
                  </Button>
                  <Button
                    variant={shapeTool === "line" ? "default" : "outline"}
                    onClick={() => {
                      setShapeTool("line");
                      setActiveTool("shape");
                    }}
                    size="sm"
                  >
                    <ArrowLeftRightIcon className="mr-2 size-4" />
                    Line
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <ToggleGroupItem value="camera" aria-label="Place camera">
              <CameraIcon className="size-4" />
              Camera
            </ToggleGroupItem>
            <ToggleGroupItem value="person" aria-label="Place person">
              <UserRoundIcon className="size-4" />
              Person
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackgroundImage}
            className="rounded-full"
          >
            <WallpaperIcon className="mr-2 size-4" />
            Add background
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Badge variant="outline">{activeToolLabel}</Badge>
            <Badge variant="secondary">Walls {scene.walls.length}</Badge>
            <Badge variant="secondary">Shapes {scene.shapes.length}</Badge>
          </div>
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear board?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all objects, reset history, and clear the canvas
              background.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleClearBoard}>
              Clear
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

CanvasEditor.displayName = "canvas-editor";
