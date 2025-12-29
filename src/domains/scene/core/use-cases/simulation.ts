import { clamp, random } from "@lodash-es";
import type {
  CameraEntity,
  PersonEntity,
  SceneState,
  ShapeEntity,
  Vector2,
} from "../types";
import {
  add,
  angleBetween,
  boundingBoxForPerson,
  buildObstacleSegments,
  clampAngle,
  closestObstacleIntersection,
  dot,
  length,
  normalize,
  pointInPolygon,
  rotate,
  scale,
  segmentIntersection,
  sub,
  toDegrees,
} from "../geometry";

const RAY_COUNT = 400;
const TRAIL_LIMIT = 240;
const TRAIL_SAMPLE_DISTANCE = 0.2;

interface ObstacleSegment {
  start: Vector2;
  end: Vector2;
  height: number;
  blocksVision: boolean;
}

function shapeToSegments(shape: ShapeEntity): ObstacleSegment[] {
  const segments: ObstacleSegment[] = [];
  const center = shape.position;
  const rot = shape.rotation;
  const width = shape.width ?? 1;
  const lengthVal = shape.length ?? width;
  const radius = shape.radius ?? width / 2;
  const base = shape.blocksVision;

  if (shape.shape === "rectangle") {
    const hw = width / 2;
    const hl = lengthVal / 2;
    const corners = [
      rotate({ x: -hw, y: -hl }, rot),
      rotate({ x: hw, y: -hl }, rot),
      rotate({ x: hw, y: hl }, rot),
      rotate({ x: -hw, y: hl }, rot),
    ].map((p) => add(p, center));
    for (let i = 0; i < corners.length; i++) {
      const start = corners[i];
      const end = corners[(i + 1) % corners.length];
      segments.push({ start, end, height: shape.height, blocksVision: base });
    }
  }

  if (shape.shape === "triangle") {
    const size = width;
    const pts = [
      rotate({ x: 0, y: -size / 2 }, rot),
      rotate({ x: size / 2, y: size / 2 }, rot),
      rotate({ x: -size / 2, y: size / 2 }, rot),
    ].map((p) => add(p, center));
    for (let i = 0; i < pts.length; i++) {
      const start = pts[i];
      const end = pts[(i + 1) % pts.length];
      segments.push({ start, end, height: shape.height, blocksVision: base });
    }
  }

  if (shape.shape === "circle") {
    const steps = 24;
    const pts: Vector2[] = [];
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 360;
      const pt = add(rotate({ x: radius, y: 0 }, angle + rot), center);
      pts.push(pt);
    }
    for (let i = 0; i < pts.length; i++) {
      const start = pts[i];
      const end = pts[(i + 1) % pts.length];
      segments.push({ start, end, height: shape.height, blocksVision: base });
    }
  }

  if (shape.shape === "line") {
    const len = lengthVal;
    const dir = rotate({ x: len / 2, y: 0 }, rot);
    const start = add(center, scale(dir, -1));
    const end = add(center, dir);
    segments.push({ start, end, height: shape.height, blocksVision: true });
  }

  return segments;
}

function obstaclesFromScene(state: SceneState): ObstacleSegment[] {
  const wallSegments = buildObstacleSegments(state.walls).map((segment) => ({
    ...segment,
    blocksVision: true,
  }));
  const shapeSegments = state.shapes.flatMap(shapeToSegments);
  return [...wallSegments, ...shapeSegments];
}

function computeVisionPolygon(
  camera: CameraEntity,
  obstacles: ObstacleSegment[],
  rayCount = RAY_COUNT
): Vector2[] {
  const origin = camera.position;
  const halfFov = camera.fov / 2;
  const startAngle = camera.direction - halfFov;
  const points: Vector2[] = [];
  for (let i = 0; i < rayCount; i++) {
    const t = rayCount === 1 ? 0.5 : i / (rayCount - 1);
    const angle = startAngle + t * camera.fov;
    const dir = normalize(rotate({ x: 1, y: 0 }, angle));
    const hit = closestObstacleIntersection(origin, dir, camera.depth, obstacles, {
      minHeight: camera.height,
      requireBlocksVision: true,
    });
    points.push(hit.point);
  }
  return points;
}

function isPersonVisible(person: PersonEntity, camera: CameraEntity, obstacles: ObstacleSegment[]) {
  const rel = sub(person.position, camera.position);
  const dist = length(rel);
  if (dist > camera.depth || dist < camera.nearPlane) return { visible: false } as const;

  const dirVec = rotate({ x: 1, y: 0 }, camera.direction);
  const angle = angleBetween(dirVec, rel);
  if (Math.abs(angle) > camera.fov / 2) return { visible: false } as const;

  for (const obstacle of obstacles) {
    if (!obstacle.blocksVision) continue;
    const hit = segmentIntersection(camera.position, person.position, obstacle.start, obstacle.end);
    if (!hit) continue;
    const totalDist = length(sub(person.position, camera.position));
    const hitDist = length(sub(hit, camera.position));
    const heightAtHit = camera.height - ((camera.height - person.height) * hitDist) / totalDist;
    if (obstacle.height >= heightAtHit) {
      return { visible: false } as const;
    }
  }

  return { visible: true } as const;
}

function computeBoundingBoxes(camera: CameraEntity, people: PersonEntity[]) {
  return people.map((person) => {
    const box = boundingBoxForPerson(
      camera.position,
      camera.direction,
      camera.fov,
      camera.resolution.width,
      camera.resolution.height,
      person
    );
    return { personId: person.id, visible: Boolean(box), boundingBox: box ?? undefined };
  });
}

function randomPoint(min: Vector2, max: Vector2): Vector2 {
  return { x: random(min.x, max.x, true), y: random(min.y, max.y, true) };
}

function boundsFromAreas(state: SceneState): { min: Vector2; max: Vector2 } | null {
  if (!state.areas.length) return null;
  const xs = state.areas.flatMap((area) => area.geometry.points.map((p) => p.x));
  const ys = state.areas.flatMap((area) => area.geometry.points.map((p) => p.y));
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

function canvasBounds(state: SceneState): { min: Vector2; max: Vector2 } {
  const xs = [...state.walls.flatMap((w) => [w.start.x, w.end.x]), ...state.shapes.map((s) => s.position.x)];
  const ys = [...state.walls.flatMap((w) => [w.start.y, w.end.y]), ...state.shapes.map((s) => s.position.y)];
  const pad = 10;
  const minX = xs.length ? Math.min(...xs) - pad : -20;
  const maxX = xs.length ? Math.max(...xs) + pad : 20;
  const minY = ys.length ? Math.min(...ys) - pad : -20;
  const maxY = ys.length ? Math.max(...ys) + pad : 20;
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

function keepInsideBounds(point: Vector2, bounds: { min: Vector2; max: Vector2 }) {
  return {
    x: clamp(point.x, bounds.min.x, bounds.max.x),
    y: clamp(point.y, bounds.min.y, bounds.max.y),
  };
}

function updatePerson(person: PersonEntity, state: SceneState, dt: number, obstacles: ObstacleSegment[]) {
  const target = person.target;
  const bounds = state.mode === "map" ? boundsFromAreas(state) ?? canvasBounds(state) : canvasBounds(state);
  const nextTarget =
    !target || length(sub(target, person.position)) < 0.5
      ? pickNewTarget(person, state, bounds)
      : target;
  const desired = normalize(sub(nextTarget, person.position));
  const velocity = scale(desired, person.speed * dt);
  let nextPosition = add(person.position, velocity);

  for (const obstacle of obstacles) {
    if (obstacle.blocksVision && isCollidingWithSegment(nextPosition, person.radius, obstacle)) {
      const away = normalize({
        x: nextPosition.x - obstacle.start.x,
        y: nextPosition.y - obstacle.start.y,
      });
      nextPosition = add(nextPosition, scale(away, 0.2));
    }
  }

  nextPosition = keepInsideBounds(nextPosition, bounds);

  const trail = person.trailEnabled ? updateTrail(person.trail, person.position) : person.trail;

  return {
    ...person,
    position: nextPosition,
    target: nextTarget,
    direction: clampAngle(toDegrees(Math.atan2(desired.y, desired.x))),
    trail,
  };
}

function isCollidingWithSegment(point: Vector2, radius: number, segment: ObstacleSegment) {
  const ap = sub(point, segment.start);
  const ab = sub(segment.end, segment.start);
  const abLen2 = length(ab) ** 2 || 1;
  const t = clamp(dot(ap, ab) / abLen2, 0, 1);
  const closest = add(segment.start, scale(ab, t));
  const dist = length(sub(point, closest));
  return dist < radius + 0.1;
}

function pickNewTarget(person: PersonEntity, state: SceneState, bounds: { min: Vector2; max: Vector2 }): Vector2 {
  let candidate = randomPoint(bounds.min, bounds.max);
  if (state.mode === "map" && state.areas.length) {
    const targetArea = person.areaId
      ? state.areas.find((area) => area.id === person.areaId) ?? state.areas[0]
      : state.areas[0];
    let attempts = 0;
    while (!pointInPolygon(candidate, targetArea.geometry.points) && attempts < 8) {
      candidate = randomPoint(bounds.min, bounds.max);
      attempts += 1;
    }
  }
  return candidate;
}

function updateTrail(trail: Vector2[], position: Vector2) {
  if (!trail.length) return [position];
  const last = trail[trail.length - 1];
  if (length(sub(position, last)) < TRAIL_SAMPLE_DISTANCE) return trail;
  const next = [...trail, position];
  if (next.length > TRAIL_LIMIT) next.shift();
  return next;
}

export function stepSimulation(state: SceneState, deltaMs: number) {
  const dt = deltaMs / 1000;
  const obstacles = obstaclesFromScene(state);
  if (state.simulation.playing) {
    state.people = state.people.map((person) => updatePerson(person, state, dt, obstacles));
  }
  state.cameras = state.cameras.map((camera) => {
    const visionPolygon = computeVisionPolygon(camera, obstacles);
    const detections = state.people.map((person) => {
      const visibleCheck = isPersonVisible(person, camera, obstacles);
      const boundingBoxes = computeBoundingBoxes(camera, [person]);
      const box = boundingBoxes[0];
      return {
        personId: person.id,
        visible: visibleCheck.visible && Boolean(box.boundingBox),
        boundingBox: box.boundingBox,
      };
    });
    return { ...camera, visionPolygon, detections } satisfies CameraEntity;
  });
}
