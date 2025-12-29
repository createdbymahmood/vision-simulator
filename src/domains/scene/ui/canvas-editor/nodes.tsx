import { useEffect, useRef } from "react";
import { Circle, Group, Line, Rect, RegularPolygon, Transformer } from "react-konva";

import {
  DEFAULT_PREVIEW_COLOR,
  DEFAULT_SHAPE_COLOR,
  GRID_SIZE,
} from "./constants";
import type { CanvasPoint } from "./types";
import type {
  SceneArea,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from "../../core/scene-types";

export function WallSegment({
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
      lineCap="round"
      lineJoin="round"
      listening
    />
  );
}

export function ShapeNode({
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
  const fill = shape.color || DEFAULT_SHAPE_COLOR;

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

export function CameraNode({ camera }: { camera: SceneCamera }) {
  return (
    <RegularPolygon
      x={camera.x * GRID_SIZE}
      y={camera.y * GRID_SIZE}
      sides={3}
      radius={12}
      rotation={camera.direction}
      fill={DEFAULT_SHAPE_COLOR}
      opacity={0.8}
    />
  );
}

export function PersonNode({ person }: { person: ScenePerson }) {
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

export function AreaNode({ area }: { area: SceneArea }) {
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

export function DrawingPreviewLine({
  anchors,
  preview,
  scale,
}: {
  anchors: CanvasPoint[];
  preview: CanvasPoint | null;
  scale: number;
}) {
  const pointsArray = [...anchors];
  if (preview) {
    pointsArray.push(preview);
  }
  const points = pointsArray.flatMap((p) => [p.x * GRID_SIZE, p.y * GRID_SIZE]);
  return (
    <Line
      points={points}
      stroke={DEFAULT_PREVIEW_COLOR}
      strokeWidth={2 / scale}
      dash={[6, 4]}
    />
  );
}
