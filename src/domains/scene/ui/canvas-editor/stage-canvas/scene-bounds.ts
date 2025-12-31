import type {Scene} from '../../../core/scene-types'

export const computeSceneBounds = (scene: Scene) => {
  const xs: number[] = []
  const ys: number[] = []

  scene.walls.forEach((wall) => {
    xs.push(wall.coordinates.x1, wall.coordinates.x2)
    ys.push(wall.coordinates.y1, wall.coordinates.y2)
  })

  scene.shapes.forEach((shape) => {
    const x2 = shape.x + shape.width
    const y2 = shape.y + shape.length
    xs.push(shape.x, x2)
    ys.push(shape.y, y2)
  })

  scene.cameras.forEach((camera) => {
    xs.push(camera.x)
    ys.push(camera.y)
  })

  scene.people.forEach((person) => {
    xs.push(person.x)
    ys.push(person.y)
  })

  const defaultMin = -5
  const defaultMax = 5
  const minX = xs.length ? Math.min(...xs, defaultMin) : defaultMin
  const maxX = xs.length ? Math.max(...xs, defaultMax) : defaultMax
  const minY = ys.length ? Math.min(...ys, defaultMin) : defaultMin
  const maxY = ys.length ? Math.max(...ys, defaultMax) : defaultMax

  return {minX, maxX, minY, maxY}
}
