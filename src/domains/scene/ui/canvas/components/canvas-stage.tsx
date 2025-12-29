import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Stage } from "react-konva";
import { length, snapToGrid, sub } from "@/domains/scene/core/geometry";
import type {
  BackgroundLayer,
  CameraEntity,
  GridSettings,
  PersonEntity,
  SelectionKind,
  ShapeEntity,
  ShapeKind,
  ToolId,
  Vector2,
  WallSegment,
} from "@/domains/scene/core/types";
import { BackgroundLayer as BackgroundImageLayer } from "./stage/background-layer";
import { DrawingOverlay } from "./stage/drawing-overlay";
import { EntitiesLayer } from "./stage/entities-layer";
import { GridLayer } from "./stage/grid-layer";
import { hitTest, isBlocked } from "./stage/hit-testing";
import { GRID_MINOR, PX_PER_METER } from "./stage/stage-constants";
import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from "../../../core/defaults";

export interface CanvasStageHandle {
  exportImage: () => string | null;
}

interface CanvasStageProps {
  size: { width: number; height: number };
  grid: GridSettings;
  background?: BackgroundLayer;
  shapes: ShapeEntity[];
  walls: WallSegment[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  showTrails: boolean;
  selectionMode: boolean;
  activeTool: ToolId;
  onSelect: (selection: SelectionKind | null) => void;
  onAddWall: (start: Vector2, end: Vector2) => void;
  onAddShape: (
    kind: ShapeKind,
    position: Vector2,
    overrides?: Partial<ShapeEntity>
  ) => void;
  onAddCamera: (position: Vector2) => void;
  onAddPerson: (position: Vector2) => void;
  onMoveCamera: (id: string, position: Vector2) => void;
  onBackgroundSelect: () => void;
  onInvalid: (message: string | null) => void;
}

const WALL_PREVIEW_THICKNESS = 0.25;

export const CanvasStage = forwardRef<CanvasStageHandle, CanvasStageProps>(
  (
    {
      size,
      grid,
      background,
      shapes,
      walls,
      cameras,
      people,
      showTrails,
      selectionMode,
      activeTool,
      onSelect,
      onAddWall,
      onAddShape,
      onAddCamera,
      onAddPerson,
      onMoveCamera,
      onBackgroundSelect,
      onInvalid,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage | null>(null);
    const initialized = useRef(false);
    const [zoom, setZoom] = useState(0.2);
    const [stageOffset, setStageOffset] = useState({
      x: size.width / 2,
      y: size.height / 2,
    });
    const [drawingWall, setDrawingWall] = useState<Vector2[]>([]);
    const [drawingShape, setDrawingShape] = useState<{
      kind: ShapeKind;
      start: Vector2;
      current: Vector2;
    } | null>(null);
    const [hover, setHover] = useState<Vector2 | null>(null);
    const [hoverTarget, setHoverTarget] = useState<SelectionKind | null>(null);
    const [draggingCamera, setDraggingCamera] = useState<{
      id: string;
      offset: Vector2;
      initial: Vector2;
      position: Vector2;
    } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef<{ x: number; y: number } | null>(null);

    const stageWidth = Math.max(600, size.width - 20);
    const stageHeight = Math.max(520, size.height - 80);

    useImperativeHandle(ref, () => ({
      exportImage: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null,
    }));

    useEffect(() => {
      if (initialized.current) return;
      if (!size.width || !size.height) return;
      initialized.current = true;
      setStageOffset({ x: size.width / 2, y: size.height / 2 });
    }, [size.height, size.width]);

    const imageDataUrl = background?.imageDataUrl;
    const backgroundImage = useMemo(() => {
      if (!imageDataUrl) return null;
      const img = new window.Image();
      img.src = imageDataUrl;
      return img;
    }, [imageDataUrl]);

    const worldPoint = (): Vector2 => {
      const stage = stageRef.current;
      const point = stage?.getPointerPosition();
      if (!point) return { x: 0, y: 0 };
      return {
        x: (point.x - stageOffset.x) / (PX_PER_METER * zoom),
        y: (point.y - stageOffset.y) / (PX_PER_METER * zoom),
      };
    };

    const toCanvas = (point: Vector2) => ({
      x: point.x * PX_PER_METER * zoom + stageOffset.x,
      y: point.y * PX_PER_METER * zoom + stageOffset.y,
    });

    const pointerWorldPoint = () => {
      const point = worldPoint();
      if (!point) return { raw: { x: 0, y: 0 }, snapped: { x: 0, y: 0 } };
      const snapped = grid.snapToGrid ? snapToGrid(point, GRID_MINOR) : point;
      return { raw: point, snapped };
    };

    const camerasWithDrag = useMemo(() => {
      if (!draggingCamera) return cameras;
      return cameras.map((camera) =>
        camera.id === draggingCamera.id
          ? { ...camera, position: draggingCamera.position }
          : camera
      );
    }, [cameras, draggingCamera]);

    const handleWheel = (evt: KonvaEventObject<WheelEvent>) => {
      evt.evt.preventDefault();
      const delta = evt.evt.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(3, Math.max(0.1, prev + delta)));
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

    const handleWallFinish = () => {
      if (drawingWall.length < 2) return;
      for (let i = 0; i < drawingWall.length - 1; i++) {
        const start = drawingWall[i];
        const end = drawingWall[i + 1];
        if (start.x === end.x && start.y === end.y) continue;
        onAddWall(start, end);
      }
      setDrawingWall([]);
    };

    const placeShape = (kind: ShapeKind, start: Vector2, current: Vector2) => {
      const width = Math.abs(current.x - start.x);
      const height = Math.abs(current.y - start.y);
      const center: Vector2 = {
        x: (start.x + current.x) / 2,
        y: (start.y + current.y) / 2,
      };
      const position = grid.snapToGrid
        ? snapToGrid(center, GRID_MINOR)
        : center;
      const overrides: Partial<ShapeEntity> = {};
      if (kind === "rectangle" || kind === "triangle") {
        overrides.width = Math.max(0.1, width);
        overrides.length = Math.max(0.1, height);
      }
      if (kind === "circle") {
        overrides.radius = Math.max(width, height) / 2 || 1;
      }
      if (kind === "line") {
        overrides.length = Math.max(width, height) || 1;
        overrides.rotation =
          (Math.atan2(current.y - start.y, current.x - start.x) * 180) /
          Math.PI;
      }
      onAddShape(kind, position, overrides);
      setDrawingShape(null);
    };

    const processStageAction = (_pointRaw: Vector2, point: Vector2) => {
      if (isPanning) return;

      if (!selectionMode && activeTool === "select") return;

      if (activeTool === "wall") {
        setDrawingWall((prev) => [...prev, point]);
        return;
      }

      if (activeTool.startsWith("shape-")) {
        setDrawingShape({
          kind: activeTool.replace("shape-", "") as ShapeKind,
          start: point,
          current: point,
        });
        return;
      }

      if (activeTool === "camera") {
        if (isBlocked(point, shapes, walls)) {
          onInvalid("Camera cannot be inside walls/shapes");
          return;
        }
        onAddCamera(point);
        return;
      }

      if (activeTool === "person") {
        const colliding = people.some(
          (person) =>
            Math.hypot(
              person.position.x - point.x,
              person.position.y - point.y
            ) <
            person.radius * 2
        );
        const blocked = isBlocked(point, shapes, walls);
        if (colliding || blocked) {
          onInvalid("Cannot place person overlapping another person");
          return;
        }
        onAddPerson(point);
        return;
      }

      if (!selectionMode) return;
      const hit = hitTest(point, shapes, walls, cameras, people, background);
      if (hit?.kind === "background") {
        onSelect(null);
        return;
      }
      onSelect(hit);
    };

    const onStageMouseMove = (evt: KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        onPanMove(evt);
        return;
      }
      const point = worldPoint();
      if (draggingCamera && point) {
        const nextPosition = {
          x: point.x - draggingCamera.offset.x,
          y: point.y - draggingCamera.offset.y,
        };
        const snapped = grid.snapToGrid
          ? snapToGrid(nextPosition, GRID_MINOR)
          : nextPosition;
        setDraggingCamera((prev) =>
          prev ? { ...prev, position: snapped } : prev
        );
        return;
      }

      if (activeTool === "select" && selectionMode && point) {
        const hit = hitTest(point, shapes, walls, cameras, people, background);
        setHoverTarget(hit);
      } else {
        setHoverTarget(null);
      }

      setHover(point);
      if (point && drawingShape) {
        setDrawingShape({ ...drawingShape, current: point });
      }
    };

    const onStageDblClick = () => {
      if (activeTool === "wall") handleWallFinish();
    };

    const cursorClass =
      isPanning || draggingCamera
        ? "cursor-grabbing"
        : activeTool === "select"
        ? hoverTarget
          ? "cursor-pointer"
          : "cursor-default"
        : "cursor-crosshair";

    return (
      <div className="relative min-h-[70vh] flex-1 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card/60 to-card">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={1}
          scaleY={1}
          onWheel={handleWheel}
          onMouseDown={(evt) => {
            if (evt.evt.button === 1 || evt.evt.shiftKey) {
              startPan(evt.evt.clientX, evt.evt.clientY);
              return;
            }
            const { raw, snapped } = pointerWorldPoint();
            if (selectionMode && activeTool === "select") {
              const hit = hitTest(
                snapped,
                shapes,
                walls,
                cameras,
                people,
                background
              );
              if (hit?.kind === "camera") {
                const camera = cameras.find((item) => item.id === hit.id);
                if (camera) {
                  const offset = sub(raw, camera.position);
                  setDraggingCamera({
                    id: camera.id,
                    offset,
                    initial: camera.position,
                    position: camera.position,
                  });
                  onSelect(hit);
                  return;
                }
              }
            }
            processStageAction(raw, snapped);
          }}
          onMouseMove={onStageMouseMove}
          onDblClick={onStageDblClick}
          className={cursorClass}
          onMouseUp={() => {
            if (draggingCamera) {
              const delta = length(
                sub(draggingCamera.position, draggingCamera.initial)
              );
              if (delta > 0.001) {
                onMoveCamera(draggingCamera.id, draggingCamera.position);
              }
              setDraggingCamera(null);
            }
            if (drawingShape)
              placeShape(
                drawingShape.kind,
                drawingShape.start,
                drawingShape.current
              );
            if (isPanning) {
              setIsPanning(false);
              panStart.current = null;
            }
          }}
        >
          <GridLayer
            width={stageWidth}
            height={stageHeight}
            offset={stageOffset}
            zoom={zoom}
          />
          <BackgroundImageLayer
            background={background}
            image={backgroundImage}
            toCanvas={toCanvas}
            zoom={zoom}
            onSelect={onBackgroundSelect}
          />
          <EntitiesLayer
            shapes={shapes}
            walls={walls}
            cameras={camerasWithDrag}
            people={people}
            toCanvas={toCanvas}
            showTrails={showTrails}
            listening={selectionMode}
          />
          <DrawingOverlay
            drawingWall={drawingWall}
            drawingShape={drawingShape}
            hover={hover}
            showMeasurements={grid.measurementOverlay}
            toCanvas={toCanvas}
            wallPreview={
              drawingWall.length && hover
                ? {
                    start: drawingWall[drawingWall.length - 1],
                    end: grid.snapToGrid
                      ? snapToGrid(hover, GRID_MINOR)
                      : hover,
                    thickness:
                      (grid.measurementOverlay
                        ? WALL_PREVIEW_THICKNESS
                        : DEFAULT_WALL_THICKNESS) *
                      PX_PER_METER *
                      zoom,
                    color: DEFAULT_WALL_COLOR,
                  }
                : undefined
            }
          />
        </Stage>
      </div>
    );
  }
);

CanvasStage.displayName = "canvas-stage";
