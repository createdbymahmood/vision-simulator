import { Circle, Group, Layer, Line, Rect } from "react-konva";
import type { CameraEntity, PersonEntity, ShapeEntity, Vector2, WallSegment } from "@/domains/scene/core/types";
import { PX_PER_METER } from "./stage-constants";
import { trianglePoints } from "./geometry";

interface EntitiesLayerProps {
  shapes: ShapeEntity[];
  walls: WallSegment[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  toCanvas: (point: Vector2) => { x: number; y: number };
  showTrails: boolean;
  listening: boolean;
}

export function EntitiesLayer({ shapes, walls, cameras, people, toCanvas, showTrails, listening }: EntitiesLayerProps) {
  return (
    <Layer listening={listening}>
      {shapes.map((shape) => renderShape(shape, toCanvas))}
      {walls.map((wall) => renderWall(wall, toCanvas))}
      {cameras.map((camera) => renderCamera(camera, toCanvas))}
      {people.map((person) => renderPerson(person, toCanvas, showTrails))}
    </Layer>
  );
}

function renderWall(wall: WallSegment, toCanvas: (point: Vector2) => { x: number; y: number }) {
  const start = toCanvas(wall.start);
  const end = toCanvas(wall.end);
  return (
    <Group key={wall.id}>
      <Line points={[start.x, start.y, end.x, end.y]} stroke={wall.color} strokeWidth={wall.thickness * PX_PER_METER} opacity={wall.opacity} />
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
    return <Circle key={shape.id} x={pos.x} y={pos.y} radius={(shape.radius ?? 1) * PX_PER_METER} fill={shape.color} opacity={shape.opacity} />;
  }
  if (shape.shape === "triangle") {
    const radius = (shape.width / 2) * PX_PER_METER;
    const points = trianglePoints(pos, radius, shape.rotation ?? 0).flatMap((pt) => [pt.x, pt.y]);
    return <Line key={shape.id} points={points} closed fill={shape.color} opacity={shape.opacity} />;
  }
  if (shape.shape === "line") {
    const len = shape.length * PX_PER_METER;
    const angle = shape.rotation ?? 0;
    const end = { x: pos.x + len * Math.cos((angle * Math.PI) / 180), y: pos.y + len * Math.sin((angle * Math.PI) / 180) };
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
