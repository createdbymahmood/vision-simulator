import type {
  Scene,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'
import type {CanvasPoint} from './types'

const sqr = (value: number) => value * value

const distanceSquared = (a: CanvasPoint, b: CanvasPoint) =>
  sqr(a.x - b.x) + sqr(a.y - b.y)

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const distancePointToSegmentSquared = (
  point: CanvasPoint,
  start: CanvasPoint,
  end: CanvasPoint,
) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) {
    return distanceSquared(point, start)
  }
  const t = clamp01(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
  )
  const projection = {x: start.x + t * dx, y: start.y + t * dy}
  return distanceSquared(point, projection)
}

const isPointNearWall = (point: CanvasPoint, wall: SceneWall): boolean => {
  const distSq = distancePointToSegmentSquared(
    point,
    {x: wall.coordinates.x1, y: wall.coordinates.y1},
    {x: wall.coordinates.x2, y: wall.coordinates.y2},
  )
  const threshold = Math.max(wall.thickness / 2, 0.01)
  return distSq <= sqr(threshold)
}

const isPointInsideRect = (point: CanvasPoint, shape: SceneShape): boolean => {
  const minX = Math.min(shape.x, shape.x + shape.width)
  const maxX = Math.max(shape.x, shape.x + shape.width)
  const minY = Math.min(shape.y, shape.y + shape.length)
  const maxY = Math.max(shape.y, shape.y + shape.length)
  return (
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  )
}

const isPointInsideCircle = (
  point: CanvasPoint,
  shape: SceneShape,
): boolean => {
  const radius = Math.max(shape.width, shape.length) / 2
  const center = {x: shape.x + radius, y: shape.y + radius}
  return distanceSquared(point, center) <= sqr(radius)
}

const isPointInShape = (point: CanvasPoint, shape: SceneShape): boolean => {
  if (shape.type === 'circle') {
    return isPointInsideCircle(point, shape)
  }
  if (shape.type === 'line') {
    const end = {x: shape.x + shape.width, y: shape.y + shape.length}
    const threshold = Math.max(shape.lineThickness / 2, 0.01)
    const distSq = distancePointToSegmentSquared(
      point,
      {x: shape.x, y: shape.y},
      end,
    )
    return distSq <= sqr(threshold)
  }
  return isPointInsideRect(point, shape)
}

const hasPersonCollision = (
  point: CanvasPoint,
  people: ScenePerson[],
  radius: number,
): boolean => {
  return people.some((existing) => {
    const combined = existing.radius + radius
    const distSq = distanceSquared(point, {x: existing.x, y: existing.y})
    return distSq <= sqr(combined)
  })
}

export const findValidPersonPosition = (
  point: CanvasPoint,
  scene: Scene,
  radius: number,
): CanvasPoint | null => {
  const isBlockedByWall = scene.walls.some((wall) =>
    isPointNearWall(point, wall),
  )
  const isInsideShape = scene.shapes.some((shape) =>
    isPointInShape(point, shape),
  )
  const collidesWithPerson = hasPersonCollision(point, scene.people, radius)

  if (!isBlockedByWall && !isInsideShape && !collidesWithPerson) {
    return point
  }

  const offsets = [
    {x: radius * 2, y: 0},
    {x: -radius * 2, y: 0},
    {x: 0, y: radius * 2},
    {x: 0, y: -radius * 2},
  ]

  for (const offset of offsets) {
    const candidate = {x: point.x + offset.x, y: point.y + offset.y}
    const blocked = scene.walls.some((wall) => isPointNearWall(candidate, wall))
    const inside = scene.shapes.some((shape) =>
      isPointInShape(candidate, shape),
    )
    const personCollision = hasPersonCollision(candidate, scene.people, radius)
    if (!blocked && !inside && !personCollision) {
      return candidate
    }
  }

  return null
}
