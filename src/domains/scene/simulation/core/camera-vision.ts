import RBush from 'rbush'

import type {
  Scene,
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

interface Point {
  x: number
  y: number
}

interface Segment {
  a: Point
  b: Point
  height: number
  id?: string
}

interface IndexedSegment extends Segment {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface VisionContext {
  index: RBush<IndexedSegment>
  signature: string
  segments: IndexedSegment[]
  walls: SceneWall[]
}

export interface VisionPerson {
  id: string
  x: number
  y: number
  height: number
  radius: number
}

export interface PersonVisibility {
  id: string
  visible: boolean
  distance: number
  occludedBy?: string | null
  inRange: boolean
  inFov: boolean
  center: Point
  height: number
  radius: number
}

export interface CameraVisionResult {
  points: Point[]
  visiblePeople: PersonVisibility[]
  sampleCount: number
}

export interface VisionOptions {
  baseSamples?: number
  maxSamples?: number
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const normalizeAngle = (angle: number) => {
  const twoPi = Math.PI * 2
  let next = angle % twoPi
  if (next < 0) {
    next += twoPi
  }
  return next
}

const defaultMaxDistance = 80
const minRayDistance = 0.01

const polygonCache = new Map<
  string,
  {signature: string; points: Point[]; sampleCount: number}
>()

const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

const rectanglePoints = (shape: SceneShape): Point[] => {
  const origin = {x: shape.x, y: shape.y}
  const corners: Point[] = [
    {x: shape.x, y: shape.y},
    {x: shape.x + shape.width, y: shape.y},
    {x: shape.x + shape.width, y: shape.y + shape.length},
    {x: shape.x, y: shape.y + shape.length},
  ]
  if (!shape.rotation) {
    return corners
  }
  return corners.map((corner) => rotatePoint(corner, origin, shape.rotation))
}

const circlePoints = (shape: SceneShape, segments = 48): Point[] => {
  const radius = Math.max(Math.min(shape.width, shape.length) / 2, 0.01)
  const origin = {x: shape.x, y: shape.y}
  const center = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.length / 2,
  }
  const rotatedCenter =
    shape.rotation && Math.abs(shape.rotation) > 0.0001
      ? rotatePoint(center, origin, shape.rotation)
      : center
  return Array.from({length: segments}, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return {
      x: rotatedCenter.x + radius * Math.cos(angle),
      y: rotatedCenter.y + radius * Math.sin(angle),
    }
  })
}

const trianglePoints = (shape: SceneShape): Point[] => {
  const radius = Math.max(Math.min(shape.width, shape.length), 0.01) / 2
  const center: Point = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.length / 2,
  }
  const origin: Point = {x: shape.x, y: shape.y}
  const points: Point[] = Array.from({length: 3}, (_, index) => {
    const angle = -Math.PI / 2 + (index * (2 * Math.PI)) / 3
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })
  if (!shape.rotation) {
    return points
  }
  return points.map((point) => rotatePoint(point, origin, shape.rotation))
}

const lineAsQuadPoints = (shape: SceneShape): Point[] => {
  const start: Point = {x: shape.x, y: shape.y}
  const end: Point = {x: shape.x + shape.width, y: shape.y + shape.length}
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy) || 1
  const halfThickness = (shape.lineThickness || 0.05) / 2
  const nx = (-dy / length) * halfThickness
  const ny = (dx / length) * halfThickness

  const p1 = {x: start.x + nx, y: start.y + ny}
  const p2 = {x: end.x + nx, y: end.y + ny}
  const p3 = {x: end.x - nx, y: end.y - ny}
  const p4 = {x: start.x - nx, y: start.y - ny}

  const quad = [p1, p2, p3, p4]
  if (!shape.rotation || Math.abs(shape.rotation) < 0.0001) {
    return quad
  }
  return quad.map((point) => rotatePoint(point, start, shape.rotation))
}

const shapeToSegments = (shape: SceneShape): Segment[] => {
  if (shape.type === 'circle') {
    const points = circlePoints(shape, 56)
    return points.map((point, index) => ({
      a: point,
      b: points[(index + 1) % points.length],
      height: shape.height,
      id: shape.id,
    }))
  }

  if (shape.type === 'triangle') {
    const points = trianglePoints(shape)
    return points.map((point, index) => ({
      a: point,
      b: points[(index + 1) % points.length],
      height: shape.height,
      id: shape.id,
    }))
  }

  if (shape.type === 'line') {
    const quad = lineAsQuadPoints(shape)
    return quad.map((point, index) => ({
      a: point,
      b: quad[(index + 1) % quad.length],
      height: shape.height,
      id: shape.id,
    }))
  }

  const points = rectanglePoints(shape)
  return points.map((point, index) => ({
    a: point,
    b: points[(index + 1) % points.length],
    height: shape.height,
    id: shape.id,
  }))
}

const shapesToSegments = (shapes: SceneShape[]): Segment[] =>
  shapes.flatMap((shape) => shapeToSegments(shape))

const wallsToSegments = (walls: SceneWall[]): Segment[] =>
  walls.map((wall) => ({
    a: {x: wall.coordinates.x1, y: wall.coordinates.y1},
    b: {x: wall.coordinates.x2, y: wall.coordinates.y2},
    height: wall.height,
    id: wall.id,
  }))

const segmentToIndexItem = (segment: Segment): IndexedSegment => ({
  ...segment,
  minX: Math.min(segment.a.x, segment.b.x),
  minY: Math.min(segment.a.y, segment.b.y),
  maxX: Math.max(segment.a.x, segment.b.x),
  maxY: Math.max(segment.a.y, segment.b.y),
})

const createObstacleSignature = (
  walls: SceneWall[],
  shapes: SceneShape[],
): string => {
  const wallSig = walls
    .map(
      (wall) =>
        `${wall.id}:${wall.coordinates.x1.toFixed(3)},${wall.coordinates.y1.toFixed(3)},${wall.coordinates.x2.toFixed(3)},${wall.coordinates.y2.toFixed(3)}:${wall.height.toFixed(2)}`,
    )
    .join('|')
  const shapeSig = shapes
    .map(
      (shape) =>
        `${shape.id}:${shape.type}:${shape.x.toFixed(3)},${shape.y.toFixed(3)},${shape.width.toFixed(3)},${shape.length.toFixed(3)},${shape.rotation.toFixed(4)}:${shape.height.toFixed(2)}`,
    )
    .join('|')
  return `${wallSig}#${shapeSig}`
}

export const buildVisionContext = (
  walls: SceneWall[],
  shapes: SceneShape[],
): VisionContext => {
  const segments = [...wallsToSegments(walls), ...shapesToSegments(shapes)]
  const indexed = segments.map(segmentToIndexItem)
  const index = new RBush<IndexedSegment>()
  index.load(indexed)
  return {
    index,
    signature: createObstacleSignature(walls, shapes),
    segments: indexed,
    walls,
  }
}

const segmentIntersection = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): Point | null => {
  const denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
  if (denominator === 0) {
    return null
  }
  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return null
  }
  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y),
  }
}

const projectRay = (origin: Point, angle: number, length: number): Point => ({
  x: origin.x + Math.cos(angle) * length,
  y: origin.y + Math.sin(angle) * length,
})

const distanceBetween = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}

const getRayBounds = (origin: Point, angle: number, length: number) => {
  const end = projectRay(origin, angle, length)
  const minX = Math.min(origin.x, end.x)
  const maxX = Math.max(origin.x, end.x)
  const minY = Math.min(origin.y, end.y)
  const maxY = Math.max(origin.y, end.y)
  return {minX, minY, maxX, maxY}
}

const findRayHit = (
  origin: Point,
  angle: number,
  length: number,
  index: VisionContext['index'],
  segments: IndexedSegment[],
  minDistance: number,
): Point => {
  const nearThreshold = Math.max(minDistance, minRayDistance)
  const rayEnd = projectRay(origin, angle, length)
  const bounds = getRayBounds(origin, angle, length)
  const candidates = index.search({
    minX: bounds.minX,
    minY: bounds.minY,
    maxX: bounds.maxX,
    maxY: bounds.maxY,
  })
  let closestPoint = rayEnd
  let closestDistance = length

  const testSegments = candidates.length ? candidates : segments

  for (const segment of testSegments) {
    const hit = segmentIntersection(origin, rayEnd, segment.a, segment.b)
    if (!hit) {
      continue
    }
    const distance = distanceBetween(hit, origin)
    if (distance <= nearThreshold) {
      closestPoint = origin
      closestDistance = 0
      break
    }
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = hit
    }
  }

  return closestPoint
}

const collectVertexAngles = (
  segments: IndexedSegment[],
  origin: Point,
  direction: number,
): number[] => {
  const epsilon = 0.0001
  return segments
    .flatMap((segment) => [segment.a, segment.b])
    .flatMap((point) => {
      const angle = Math.atan2(point.y - origin.y, point.x - origin.x)
      return [angle - epsilon, angle, angle + epsilon].map((candidate) => {
        const delta = Math.atan2(
          Math.sin(candidate - direction),
          Math.cos(candidate - direction),
        )
        return delta
      })
    })
}

const castCameraPolygon = (
  camera: SceneCamera,
  context: VisionContext,
  options?: VisionOptions,
): {points: Point[]; sampleCount: number} => {
  const origin: Point = {x: camera.x, y: camera.y}
  const clampedFov = Math.min(camera.fov, 179.9)
  const fovRadians = toRadians(clampedFov)
  const direction = toRadians(camera.direction)
  const halfFov = fovRadians / 2
  const minDistance = minRayDistance
  const maxDistance = camera.depth > 0 ? camera.depth : defaultMaxDistance

  const baseSamples = options?.baseSamples ?? 400
  const maxSamples = options?.maxSamples ?? 2000

  const normalizeDelta = (angle: number) =>
    Math.atan2(Math.sin(angle - direction), Math.cos(angle - direction))

  const sampledDeltas = Array.from({length: baseSamples}, (_, index) => {
    const t = index / Math.max(baseSamples - 1, 1)
    return -halfFov + t * fovRadians
  })

  const vertexDeltas = collectVertexAngles(context.segments, origin, direction)
  const deltas = Array.from(
    new Set(
      [...sampledDeltas, ...vertexDeltas]
        .map(normalizeDelta)
        .filter((delta) => Math.abs(delta) <= halfFov + 0.0001),
    ),
  ).sort((a, b) => a - b)

  const castAngles = (angles: number[]) =>
    angles.map((delta) => {
      const angle = normalizeAngle(direction + delta)
      const hit = findRayHit(
        origin,
        angle,
        maxDistance,
        context.index,
        context.segments,
        minDistance,
      )
      const distance = distanceBetween(hit, origin)
      const near = Math.max(minDistance, 0.01)
      if (distance < near) {
        return projectRay(origin, angle, near)
      }
      return hit
    })

  const basePoints = castAngles(deltas)

  const adaptiveAngles: number[] = []
  for (let i = 1; i < deltas.length; i += 1) {
    const prevPoint = basePoints[i - 1]
    const currentPoint = basePoints[i]
    const prevDistance = distanceBetween(prevPoint, origin)
    const currentDistance = distanceBetween(currentPoint, origin)
    const deltaRatio =
      Math.abs(prevDistance - currentDistance) /
      Math.max(Math.max(prevDistance, currentDistance), 0.0001)
    if (
      deltaRatio > 0.2 &&
      adaptiveAngles.length + deltas.length < maxSamples
    ) {
      adaptiveAngles.push((deltas[i - 1] + deltas[i]) / 2)
    }
  }

  const uniqueAngles = Array.from(
    new Set([...deltas, ...adaptiveAngles].map(normalizeDelta)),
  )
    .filter((delta) => Math.abs(delta) <= halfFov + 0.0001)
    .sort((a, b) => a - b)

  const points = castAngles(uniqueAngles)

  return {points: [origin, ...points], sampleCount: uniqueAngles.length}
}

const createCameraSignature = (camera: SceneCamera, context: VisionContext) =>
  [
    context.signature,
    camera.x.toFixed(3),
    camera.y.toFixed(3),
    camera.height.toFixed(3),
    camera.direction.toFixed(2),
    camera.fov.toFixed(2),
    camera.depth.toFixed(2),
    camera.zoom.toFixed(2),
  ].join('|')

const getCachedPolygon = (
  camera: SceneCamera,
  context: VisionContext,
  options?: VisionOptions,
) => {
  const signature = createCameraSignature(camera, context)
  const cached = polygonCache.get(camera.id)
  if (cached && cached.signature === signature) {
    return cached
  }
  const next = castCameraPolygon(camera, context, options)
  polygonCache.set(camera.id, {
    signature,
    points: next.points,
    sampleCount: next.sampleCount,
  })
  return next
}

const isWithinFov = (halfFov: number, targetAngle: number): boolean =>
  Math.abs(targetAngle) <= halfFov + 0.0001

const isOccludedByHeight = (
  camera: SceneCamera,
  person: VisionPerson,
  index: VisionContext['index'],
  segments: IndexedSegment[],
): string | null => {
  const origin: Point = {x: camera.x, y: camera.y}
  const target: Point = {x: person.x, y: person.y}
  const totalDistance = Math.max(distanceBetween(origin, target), 0.0001)
  const bounds = {
    minX: Math.min(origin.x, target.x) - person.radius,
    minY: Math.min(origin.y, target.y) - person.radius,
    maxX: Math.max(origin.x, target.x) + person.radius,
    maxY: Math.max(origin.y, target.y) + person.radius,
  }
  const candidates = index.search(bounds)
  const testSegments = candidates.length ? candidates : segments

  for (const segment of testSegments) {
    const hit = segmentIntersection(origin, target, segment.a, segment.b)
    if (!hit) {
      continue
    }
    const hitDistance = distanceBetween(origin, hit)
    if (hitDistance <= 0.05 || hitDistance >= totalDistance) {
      continue
    }
    const heightAtHit =
      camera.height +
      ((person.height - camera.height) * hitDistance) /
        Math.max(totalDistance, 0.0001)
    if (segment.height >= heightAtHit || segment.height >= person.height) {
      return segment.id ?? 'obstacle'
    }
  }

  return null
}

const toVisionPerson = (person: ScenePerson): VisionPerson => ({
  id: person.id,
  x: person.x,
  y: person.y,
  height: person.height,
  radius: person.radius,
})

export const computeCameraVision = (params: {
  camera: SceneCamera
  context: VisionContext
  people?: VisionPerson[]
  options?: VisionOptions
}): CameraVisionResult => {
  const {camera, context, people = [], options} = params

  if (camera.depth <= 0) {
    return {
      points: [{x: camera.x, y: camera.y}],
      visiblePeople: [],
      sampleCount: 0,
    }
  }

  const {points, sampleCount} = getCachedPolygon(camera, context, options)
  const origin: Point = {x: camera.x, y: camera.y}
  const clampedFov = Math.min(camera.fov, 179.9)
  const halfFov = toRadians(clampedFov) / 2
  const direction = toRadians(camera.direction)
  const maxDistance = camera.depth > 0 ? camera.depth : defaultMaxDistance

  const visiblePeople: PersonVisibility[] = people.map((person) => {
    const angleToPerson = Math.atan2(person.y - origin.y, person.x - origin.x)
    const delta = Math.atan2(
      Math.sin(angleToPerson - direction),
      Math.cos(angleToPerson - direction),
    )
    const distance = distanceBetween(origin, {x: person.x, y: person.y})
    const inRange = distance <= maxDistance
    const inFov = isWithinFov(halfFov, delta)
    const inPolygon = points.length
      ? pointInPolygon({x: person.x, y: person.y}, points)
      : true

    if (!inRange || !inFov || !inPolygon) {
      return {
        id: person.id,
        visible: false,
        distance,
        occludedBy: null,
        inRange,
        inFov,
        center: {x: person.x, y: person.y},
        height: person.height,
        radius: person.radius,
      }
    }

    const occludedBy = isOccludedByHeight(
      camera,
      person,
      context.index,
      context.segments,
    )

    return {
      id: person.id,
      visible: !occludedBy,
      occludedBy,
      distance,
      inRange,
      inFov,
      center: {x: person.x, y: person.y},
      height: person.height,
      radius: person.radius,
    }
  })

  return {points, visiblePeople, sampleCount}
}

export const computeSceneVisionContext = (scene: Scene): VisionContext =>
  buildVisionContext(scene.walls, scene.shapes)

export const computeVisionPolygon = (
  camera: SceneCamera,
  scene: Scene,
  options?: VisionOptions,
): Point[] => {
  const context = computeSceneVisionContext(scene)
  const {points} = getCachedPolygon(camera, context, options)
  return points
}

export const normalizePeople = (people: ScenePerson[]): VisionPerson[] =>
  people.map(toVisionPerson)

export const isPointInsidePolygon = (point: Point, polygon: Point[]) =>
  pointInPolygon(point, polygon)
