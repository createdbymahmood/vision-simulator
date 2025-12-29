import type {Scene, SceneShape, SceneWall} from '../../core/scene-types'
import type {CanvasPoint} from './types'

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const normalizeAngle = (angle: number) => {
  const twoPi = Math.PI * 2
  let next = angle % twoPi
  if (next < 0) {
    next += twoPi
  }
  return next
}

interface Segment {
  a: CanvasPoint
  b: CanvasPoint
}

const rotatePoint = (
  point: CanvasPoint,
  center: CanvasPoint,
  angle: number,
): CanvasPoint => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

const rectanglePoints = (shape: SceneShape): CanvasPoint[] => {
  const center = {x: shape.x + shape.width / 2, y: shape.y + shape.length / 2}
  const corners: CanvasPoint[] = [
    {x: shape.x, y: shape.y},
    {x: shape.x + shape.width, y: shape.y},
    {x: shape.x + shape.width, y: shape.y + shape.length},
    {x: shape.x, y: shape.y + shape.length},
  ]
  if (!shape.rotation) {
    return corners
  }
  return corners.map((corner) => rotatePoint(corner, center, shape.rotation))
}

const circlePoints = (shape: SceneShape, segments = 96): CanvasPoint[] => {
  const radiusBase = Math.max(Math.min(shape.width, shape.length) / 2, 0.01)
  const strokeAllowance = Math.max(shape.lineThickness ?? 0, 0) / 2
  const radius = Math.max(radiusBase - strokeAllowance, 0.01)
  const center = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.length / 2,
  }
  return Array.from({length: segments}, (_, index) => {
    const angle = (index / segments) * Math.PI * 2
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })
}

const trianglePoints = (shape: SceneShape): CanvasPoint[] => {
  const radius = Math.max(shape.width, shape.length) / 2
  const baseRotation = shape.rotation ?? 0
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map(
    (angle) => angle + baseRotation,
  )
  return angles.map((angle) => ({
    x: shape.x + radius * Math.cos(angle),
    y: shape.y + radius * Math.sin(angle),
  }))
}

const shapeToSegments = (shape: SceneShape): Segment[] => {
  if (shape.type === 'circle') {
    const points = circlePoints(shape, 32)
    return points.map((point, index) => ({
      a: point,
      b: points[(index + 1) % points.length],
    }))
  }

  if (shape.type === 'triangle') {
    const points = trianglePoints(shape)
    return points.map((point, index) => ({
      a: point,
      b: points[(index + 1) % points.length],
    }))
  }

  if (shape.type === 'line') {
    const start: CanvasPoint = {x: shape.x, y: shape.y}
    const end: CanvasPoint = {
      x: shape.x + shape.width,
      y: shape.y + shape.length,
    }
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
    return quad.map((point, index) => ({
      a: point,
      b: quad[(index + 1) % quad.length],
    }))
  }

  const points = rectanglePoints(shape)
  return points.map((point, index) => ({
    a: point,
    b: points[(index + 1) % points.length],
  }))
}

const wallsToSegments = (walls: SceneWall[]): Segment[] =>
  walls.map((wall) => ({
    a: {x: wall.coordinates.x1, y: wall.coordinates.y1},
    b: {x: wall.coordinates.x2, y: wall.coordinates.y2},
  }))

const shapesToSegments = (shapes: SceneShape[]): Segment[] =>
  shapes.flatMap((shape) => shapeToSegments(shape))

const segmentIntersection = (
  p1: CanvasPoint,
  p2: CanvasPoint,
  p3: CanvasPoint,
  p4: CanvasPoint,
): CanvasPoint | null => {
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

const projectRay = (
  origin: CanvasPoint,
  angle: number,
  length: number,
): CanvasPoint => ({
  x: origin.x + Math.cos(angle) * length,
  y: origin.y + Math.sin(angle) * length,
})

const getVertices = (segments: Segment[]): CanvasPoint[] => {
  const vertices: CanvasPoint[] = []
  segments.forEach((segment) => {
    vertices.push(segment.a, segment.b)
  })
  return vertices
}

const maxDepthFallback = 50

const findRayHit = (
  origin: CanvasPoint,
  angle: number,
  length: number,
  segments: Segment[],
): CanvasPoint => {
  const rayEnd = projectRay(origin, angle, length)
  let closestPoint = rayEnd
  let closestDistance = length

  segments.forEach((segment) => {
    const hit = segmentIntersection(origin, rayEnd, segment.a, segment.b)
    if (!hit) {
      return
    }
    const dx = hit.x - origin.x
    const dy = hit.y - origin.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = hit
    }
  })

  return closestPoint
}

export const computeVisionPolygon = (
  camera: Scene['cameras'][number],
  scene: Scene,
): CanvasPoint[] => {
  const segments = [
    ...wallsToSegments(scene.walls),
    ...shapesToSegments(scene.shapes),
  ]
  const origin: CanvasPoint = {x: camera.x, y: camera.y}
  const clampedFov = Math.min(camera.fov, 179.9)
  const fovRadians = toRadians(clampedFov)
  const direction = toRadians(camera.direction)
  const halfFov = fovRadians / 2
  const minDistance = camera.nearPlane ?? 0
  const maxDistance =
    camera.depth > 0 ? Math.max(camera.depth, minDistance) : maxDepthFallback

  const normalizeDelta = (angle: number) =>
    Math.atan2(Math.sin(angle - direction), Math.cos(angle - direction))

  const sampleCount = Math.max(120, Math.ceil(clampedFov / 1.5))
  const sampledDeltas = Array.from({length: sampleCount}, (_, index) => {
    const t = index / Math.max(sampleCount - 1, 1)
    return -halfFov + t * fovRadians
  })

  const vertices = getVertices(segments)
  const epsilon = 0.0001
  const candidateDeltas = vertices
    .map((vertex) => Math.atan2(vertex.y - origin.y, vertex.x - origin.x))
    .flatMap((angle) => [angle - epsilon, angle, angle + epsilon])
    .map(normalizeDelta)
    .filter((delta) => Math.abs(delta) <= halfFov + 0.0001)

  const deltas = Array.from(
    new Set([...sampledDeltas, ...candidateDeltas].map((delta) => delta)),
  ).sort((a, b) => a - b)

  const points = deltas.map((delta) => {
    const angle = normalizeAngle(direction + delta)
    const hit = findRayHit(origin, angle, maxDistance, segments)
    const dx = hit.x - origin.x
    const dy = hit.y - origin.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const near = Math.max(minDistance, 0.01)
    if (distance < near) {
      return projectRay(origin, angle, near)
    }
    return hit
  })

  return [origin, ...points]
}
