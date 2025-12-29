import type { PersonEntity, Vector2, WallSegment } from "./types";

export function clampAngle(value: number) {
  const wrapped = ((value % 360) + 360) % 360;
  return Number.isNaN(wrapped) ? 0 : wrapped;
}

export function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vector2, factor: number): Vector2 {
  return { x: v.x * factor, y: v.y * factor };
}

export function length(v: Vector2) {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Vector2): Vector2 {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len };
}

export function rotate(v: Vector2, degrees: number): Vector2 {
  const rad = toRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

export function snapToGrid(v: Vector2, gridSize: number): Vector2 {
  return {
    x: Math.round(v.x / gridSize) * gridSize,
    y: Math.round(v.y / gridSize) * gridSize,
  };
}

export function dot(a: Vector2, b: Vector2) {
  return a.x * b.x + a.y * b.y;
}

export function angleBetween(a: Vector2, b: Vector2) {
  return toDegrees(Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
}

export function segmentIntersection(
  a1: Vector2,
  a2: Vector2,
  b1: Vector2,
  b2: Vector2
): Vector2 | null {
  const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
  if (d === 0) return null;
  const u = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
  const v = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  return { x: a1.x + u * (a2.x - a1.x), y: a1.y + u * (a2.y - a1.y) };
}

export function pointInPolygon(point: Vector2, polygon: Vector2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]?.x ?? 0;
    const yi = polygon[i]?.y ?? 0;
    const xj = polygon[j]?.x ?? 0;
    const yj = polygon[j]?.y ?? 0;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function closestObstacleIntersection(
  origin: Vector2,
  direction: Vector2,
  maxDistance: number,
  obstacles: { start: Vector2; end: Vector2; height?: number; blocksVision?: boolean }[],
  options?: { minHeight?: number; requireBlocksVision?: boolean }
): { point: Vector2; distance: number; height: number } {
  const { minHeight, requireBlocksVision } = options ?? {};
  let hitPoint = add(origin, scale(direction, maxDistance));
  let hitDistance = maxDistance;
  let hitHeight = 0;

  for (const obstacle of obstacles) {
    if (requireBlocksVision && obstacle.blocksVision === false) continue;
    const obstacleHeight = obstacle.height ?? 0;
    if (typeof minHeight === "number" && obstacleHeight < minHeight) continue;

    const intersection = segmentIntersection(origin, add(origin, scale(direction, maxDistance)), obstacle.start, obstacle.end);
    if (!intersection) continue;
    const dist = length(sub(intersection, origin));
    if (dist < hitDistance) {
      hitPoint = intersection;
      hitDistance = dist;
      hitHeight = obstacleHeight;
    }
  }

  return { point: hitPoint, distance: hitDistance, height: hitHeight };
}

export function buildObstacleSegments(walls: WallSegment[]): { start: Vector2; end: Vector2; height: number }[] {
  return walls.map((wall) => ({ start: wall.start, end: wall.end, height: wall.height }));
}

export function boundingBoxForPerson(
  cameraPosition: Vector2,
  cameraDirection: number,
  fov: number,
  resolutionWidth: number,
  resolutionHeight: number,
  person: PersonEntity
): { x: number; y: number; width: number; height: number } | null {
  const dirVec = rotate({ x: 1, y: 0 }, cameraDirection);
  const rel = sub(person.position, cameraPosition);
  const distance = length(rel);
  const normalized = normalize(rel);
  const angleDelta = angleBetween(dirVec, normalized);
  const halfFov = fov / 2;
  if (Math.abs(angleDelta) > halfFov) return null;
  if (distance <= 0.01) return null;

  const focalLength = resolutionWidth / (2 * Math.tan(toRadians(fov / 2)));
  const apparentHeight = (person.height * focalLength) / distance;
  const apparentWidth = (person.radius * 2 * focalLength) / distance;

  // Map to viewport coords (0,0) top-left, dirVec forward on +x axis
  const angleNormalized = ((angleDelta + halfFov) / fov) * resolutionWidth;
  const x = resolutionWidth - angleNormalized - apparentWidth / 2;
  const y = resolutionHeight / 2 - apparentHeight * 0.8;

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(resolutionWidth - x, apparentWidth),
    height: Math.min(resolutionHeight - y, apparentHeight),
  };
}

export function paddedBoundingBox(box: { x: number; y: number; width: number; height: number }, padding: number) {
  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

export function insideBounds(point: Vector2, min: Vector2, max: Vector2) {
  return point.x >= min.x && point.x <= max.x && point.y >= min.y && point.y <= max.y;
}

export function capsuleCollision(a: PersonEntity, b: PersonEntity, buffer = 0.01) {
  const dist = length(sub(a.position, b.position));
  return dist < a.radius + b.radius + buffer;
}

export function wallCollision(person: PersonEntity, wall: WallSegment) {
  // simple distance from segment check
  const ap = sub(person.position, wall.start);
  const ab = sub(wall.end, wall.start);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / (length(ab) ** 2 || 1)));
  const closest = add(wall.start, scale(ab, t));
  const dist = length(sub(person.position, closest));
  return dist < person.radius + wall.thickness / 2;
}

export function steerAway(person: PersonEntity, target: Vector2, maxForce = 0.6) {
  const desired = normalize(sub(target, person.position));
  return scale(desired, maxForce);
}
