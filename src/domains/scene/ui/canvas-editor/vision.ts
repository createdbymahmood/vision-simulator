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

const circlePoints = (shape: SceneShape, segments = 12): CanvasPoint[] => {
  const radius = Math.max(shape.width, shape.length) / 2
  const center = {x: shape.x + radius, y: shape.y + radius}
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
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map(
    (angle) => angle + (shape.rotation ?? 0),
  )
  return angles.map((angle) => ({
    x: shape.x + radius * Math.cos(angle),
    y: shape.y + radius * Math.sin(angle),
  }))
}

const shapeToSegments = (shape: SceneShape): Segment[] => {
  if (shape.type === 'line') {
    return [
      {
        a: {x: shape.x, y: shape.y},
        b: {x: shape.x + shape.width, y: shape.y + shape.length},
      },
    ]
  }

  if (shape.type === 'circle') {
    const points = circlePoints(shape)
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
  const fovRadians = toRadians(camera.fov)
  const direction = toRadians(camera.direction)
  const halfFov = fovRadians / 2
  const minDistance = camera.nearPlane ?? 0
  const maxDistance =
    camera.depth > 0 ? Math.max(camera.depth, minDistance) : maxDepthFallback

  const baseAngles = [direction - halfFov, direction + halfFov, direction].map(
    normalizeAngle,
  )

  const vertices = getVertices(segments)
  const epsilon = 0.0001
  const candidateAngles = vertices
    .map((vertex) => Math.atan2(vertex.y - origin.y, vertex.x - origin.x))
    .flatMap((angle) => [angle - epsilon, angle, angle + epsilon])
    .filter((angle) => {
      const normalized = normalizeAngle(angle)
      const delta = Math.atan2(
        Math.sin(normalized - direction),
        Math.cos(normalized - direction),
      )
      return Math.abs(delta) <= halfFov + 0.0001
    })

  const angles = [...baseAngles, ...candidateAngles]
  const normalizedAngles = Array.from(new Set(angles.map(normalizeAngle))).sort(
    (a, b) => a - b,
  )

  const points = normalizedAngles.map((angle) => {
    const hit = findRayHit(origin, angle, maxDistance, segments)
    const dx = hit.x - origin.x
    const dy = hit.y - origin.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < minDistance) {
      return projectRay(origin, angle, minDistance)
    }
    return hit
  })

  return points
}
