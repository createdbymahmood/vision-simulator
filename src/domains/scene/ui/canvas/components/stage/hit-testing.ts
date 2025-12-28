import type {
  BackgroundLayer,
  CameraEntity,
  PersonEntity,
  SelectionKind,
  ShapeEntity,
  Vector2,
  WallSegment,
} from "@/domains/scene/core/types";
import { PX_PER_METER } from "./stage-constants";
import { pointInTriangle, pointSegmentDistance, trianglePoints } from "./geometry";

export function isBlocked(point: Vector2, shapes: ShapeEntity[], walls: WallSegment[]) {
  const wallCollision = walls.some((wall) => pointSegmentDistance(point, wall.start, wall.end) < wall.thickness / 2 + 0.1);
  const shapeCollision = shapes.some((shape) => {
    if (!shape.blocksMovement) return false;
    if (shape.shape === "circle") {
      return Math.hypot(point.x - shape.position.x, point.y - shape.position.y) < (shape.radius ?? 1);
    }
    if (shape.shape === "rectangle") {
      const halfW = shape.width / 2;
      const halfL = shape.length / 2;
      return (
        point.x >= shape.position.x - halfW &&
        point.x <= shape.position.x + halfW &&
        point.y >= shape.position.y - halfL &&
        point.y <= shape.position.y + halfL
      );
    }
    if (shape.shape === "triangle") {
      const radius = shape.width / 2;
      const pts = trianglePoints(shape.position, radius, shape.rotation ?? 0);
      return pointInTriangle(point, pts);
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

export function hitTest(
  point: Vector2,
  shapes: ShapeEntity[],
  walls: WallSegment[],
  cameras: CameraEntity[],
  people: PersonEntity[],
  background?: BackgroundLayer
): SelectionKind | null {
  const p = { x: point.x * PX_PER_METER, y: point.y * PX_PER_METER };
  const peopleHit = people
    .map((person) => ({ person, dist: Math.hypot(p.x - person.position.x * PX_PER_METER, p.y - person.position.y * PX_PER_METER) }))
    .sort((a, b) => a.dist - b.dist);
  if (peopleHit.length && peopleHit[0].dist < peopleHit[0].person.radius * PX_PER_METER * 1.2) {
    return { kind: "person", id: peopleHit[0].person.id };
  }

  const cameraHit = cameras.find((camera) => Math.hypot(p.x - camera.position.x * PX_PER_METER, p.y - camera.position.y * PX_PER_METER) < 16);
  if (cameraHit) return { kind: "camera", id: cameraHit.id };

  const wallHit = walls.find((wall) => {
    const start = { x: wall.start.x * PX_PER_METER, y: wall.start.y * PX_PER_METER };
    const end = { x: wall.end.x * PX_PER_METER, y: wall.end.y * PX_PER_METER };
    const a = { x: p.x - start.x, y: p.y - start.y };
    const b = { x: end.x - start.x, y: end.y - start.y };
    const t = Math.max(0, Math.min(1, (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y)));
    const proj = { x: start.x + b.x * t, y: start.y + b.y * t };
    const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
    return dist < wall.thickness * PX_PER_METER + 4;
  });
  if (wallHit) return { kind: "wall", id: wallHit.id };

  const shapeHit = shapes.find((shape) => {
    const pos = { x: shape.position.x * PX_PER_METER, y: shape.position.y * PX_PER_METER };
    if (shape.shape === "circle") {
      return Math.hypot(p.x - pos.x, p.y - pos.y) < (shape.radius ?? 1) * PX_PER_METER;
    }
    if (shape.shape === "rectangle") {
      const halfW = (shape.width * PX_PER_METER) / 2;
      const halfL = (shape.length * PX_PER_METER) / 2;
      return p.x >= pos.x - halfW && p.x <= pos.x + halfW && p.y >= pos.y - halfL && p.y <= pos.y + halfL;
    }
    if (shape.shape === "triangle") {
      const radius = (shape.width / 2) * PX_PER_METER;
      const pts = trianglePoints(pos, radius, shape.rotation ?? 0);
      return pointInTriangle(p, pts);
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

  if (background) return { kind: "background" };
  return null;
}
