import { useEffect, useMemo, useRef, useState } from "react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Stage } from "react-konva";

import { CanvasGrid } from "./grid";
import { MeasurementOverlay } from "./measurement-overlay";
import {
  DEFAULT_PREVIEW_COLOR,
  DEFAULT_WALL_COLOR,
  MAX_SCALE,
  MIN_SCALE,
} from "./constants";
import type { CanvasMeasurement, CanvasPoint, CanvasSize, DrawingShapeState, DrawingWallState } from "./types";
import { lengthBetween, angleBetween, pointFromStage, snapPoint, toCanvas } from "./utils";
import {
  AreaNode,
  CameraNode,
  DrawingPreviewLine,
  PersonNode,
  ShapeNode,
  WallSegment,
} from "./nodes";
import type {
  Scene,
  SceneCamera,
  SceneEntityKind,
  ScenePerson,
  SceneShape,
  SceneShapeKind,
  SceneTool,
  SceneWall,
} from "../../core/scene-types";

interface CanvasStageProps {
  size: CanvasSize;
  offset: CanvasPoint;
  scale: number;
  snapEnabled: boolean;
  editMode: boolean;
  shapeTool: SceneShapeKind;
  scene: Scene;
  selection: { selectedEntityId: string | null; selectedEntityKind: SceneEntityKind | null };
  activeTool: SceneTool;
  onOffsetChange: (point: CanvasPoint) => void;
  onScaleChange: (scale: number) => void;
  onCaptureSnapshot: (scene: Scene) => void;
  onAddWall: (wall: SceneWall) => void;
  onAddShape: (shape: SceneShape) => void;
  onUpdateShape: (id: string, patch: Partial<SceneShape>) => void;
  onAddCamera: (camera: SceneCamera) => void;
  onAddPerson: (person: ScenePerson) => void;
  onSelectEntity: (payload: { id: string; kind: SceneEntityKind } | null) => void;
  onCloseOverlays: () => void;
}

export function CanvasStage({
  size,
  offset,
  scale,
  snapEnabled,
  editMode,
  shapeTool,
  scene,
  selection,
  activeTool,
  onOffsetChange,
  onScaleChange,
  onCaptureSnapshot,
  onAddWall,
  onAddShape,
  onUpdateShape,
  onAddCamera,
  onAddPerson,
  onSelectEntity,
  onCloseOverlays,
}: CanvasStageProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [drawingWall, setDrawingWall] = useState<DrawingWallState | null>(null);
  const [drawingShape, setDrawingShape] = useState<DrawingShapeState | null>(null);
  const [measurement, setMeasurement] = useState<CanvasMeasurement | null>(null);

  useEffect(() => {
    if (size.width && size.height) {
      onOffsetChange({
        x: size.width / 2,
        y: size.height / 2,
      });
    }
  }, [onOffsetChange, size.height, size.width]);

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
      onScaleChange(newScale);
      return;
    }

    const mousePointTo = {
      x: (pointer.x - offset.x) / scale,
      y: (pointer.y - offset.y) / scale,
    };

    onScaleChange(newScale);
    onOffsetChange({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  });

  const handleDragMove = useCallbackRef((event: KonvaEventObject<DragEvent>) => {
    onOffsetChange({
      x: event.target.x(),
      y: event.target.y(),
    });
  });

  const finishWall = useCallbackRef((anchors: CanvasPoint[]) => {
    if (anchors.length < 2) {
      setDrawingWall(null);
      setMeasurement(null);
      return;
    }
    onCaptureSnapshot(scene);
    for (let i = 0; i < anchors.length - 1; i += 1) {
      const start = anchors[i];
      const end = anchors[i + 1];
      if (lengthBetween(start, end) < 0.05) {
        continue;
      }
      onAddWall({
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
        color: DEFAULT_WALL_COLOR,
        opacity: 0.9,
      });
    }
    setDrawingWall(null);
    setMeasurement(null);
  });

  const finishShape = useCallbackRef(
    (start: CanvasPoint, current: CanvasPoint, kind: SceneShapeKind) => {
      const width = Math.abs(current.x - start.x) || 1;
      const length = Math.abs(current.y - start.y) || 1;
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);

      onCaptureSnapshot(scene);
      const defaultShape: SceneShape = {
        id: crypto.randomUUID(),
        type: kind,
        x,
        y,
        rotation: 0,
        width: width || 1,
        length: length || 1,
        height: 0.1,
        color: DEFAULT_WALL_COLOR,
        opacity: 0.75,
        lineThickness: 0.05,
      };

      if (kind === "line") {
        defaultShape.length = current.y - start.y;
        defaultShape.width = current.x - start.x;
      }

      onAddShape(defaultShape);
      onSelectEntity({ id: defaultShape.id, kind: "shape" });
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
          const lastAnchor = drawingWall.anchors[drawingWall.anchors.length - 1];
          if (lengthBetween(lastAnchor, snapped) < 0.05) {
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
        setDrawingShape({ start: snapped, current: snapped });
        return;
      }

      if (activeTool === "camera") {
        onCaptureSnapshot(scene);
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
        onAddCamera(camera);
        onSelectEntity({ id: camera.id, kind: "camera" });
        return;
      }

      if (activeTool === "person") {
        onCaptureSnapshot(scene);
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
        onAddPerson(person);
        onSelectEntity({ id: person.id, kind: "person" });
        return;
      }

      if (event.target === stage) {
        onSelectEntity(null);
        onCloseOverlays();
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
      if (drawingWall.anchors.length) {
        const last = drawingWall.anchors[drawingWall.anchors.length - 1];
        setMeasurement({
          length: lengthBetween(last, snapped),
          angle: angleBetween(last, snapped),
          screen: toCanvas(snapped, offset, scale),
        });
      }
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
      finishShape(drawingShape.start, drawingShape.current, shapeTool);
    }
  });

  const handleStageDoubleClick = useCallbackRef(() => {
    if (drawingWall) {
      finishWall(drawingWall.anchors);
    }
  });

  return (
    <div
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
        width={size.width}
        height={size.height}
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
        <CanvasGrid size={size} offset={offset} scale={scale} />
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
              onSelect={() => onSelectEntity({ id: wall.id, kind: "wall" })}
            />
          ))}
          {drawingWall && (
            <DrawingPreviewLine
              anchors={drawingWall.anchors}
              preview={drawingWall.preview}
              scale={scale}
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
              onSelect={() => onSelectEntity({ id: shape.id, kind: "shape" })}
              onTransform={(next) => onUpdateShape(shape.id, next)}
            />
          ))}
          {drawingShape && (
            <ShapeNode
              shape={{
                id: "preview",
                type: shapeTool,
                x: Math.min(drawingShape.start.x, drawingShape.current.x),
                y: Math.min(drawingShape.start.y, drawingShape.current.y),
                rotation: 0,
                width: Math.abs(drawingShape.current.x - drawingShape.start.x),
                length: Math.abs(drawingShape.current.y - drawingShape.start.y),
                height: 0.1,
                color: DEFAULT_PREVIEW_COLOR,
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

      {measurement && <MeasurementOverlay measurement={measurement} />}
    </div>
  );
}
