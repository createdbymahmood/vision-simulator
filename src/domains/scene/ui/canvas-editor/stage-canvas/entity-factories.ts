import type {
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneShapeKind,
} from '../../../core/scene-types'
import type {CanvasPoint} from '../types'

import {DEFAULT_WALL_COLOR} from '../constants'

export const buildCamera = (point: CanvasPoint): SceneCamera => ({
  id: crypto.randomUUID(),
  typePreset: 'fixed',
  x: point.x,
  y: point.y,
  height: 2.5,
  direction: 45,
  fov: 90,
  depth: 15,
  zoom: 1,
  resolution: '1080p',
})

export const buildPerson = (point: CanvasPoint): ScenePerson => ({
  id: crypto.randomUUID(),
  x: point.x,
  y: point.y,
  radius: 0.3,
  height: 1.75,
  speed: 1.2,
  behavior: 'idle',
  trailEnabled: false,
})

export const buildShape = (
  kind: SceneShapeKind,
  start: CanvasPoint,
  current: CanvasPoint,
): SceneShape => {
  const dx = current.x - start.x
  const dy = current.y - start.y

  if (kind === 'line') {
    return {
      id: crypto.randomUUID(),
      type: 'line',
      x: start.x,
      y: start.y,
      rotation: 0,
      width: dx,
      length: dy,
      height: 0.1,
      color: DEFAULT_WALL_COLOR,
      opacity: 0.75,
      lineThickness: 0.05,
    }
  }

  const width = Math.abs(dx) || 1
  const length = Math.abs(dy) || 1
  const x = Math.min(start.x, current.x)
  const y = Math.min(start.y, current.y)

  return {
    id: crypto.randomUUID(),
    type: kind,
    x,
    y,
    rotation: 0,
    width: width || 1,
    length: length || 1,
    height: 0.1,
    color: DEFAULT_WALL_COLOR,
    opacity: 0.75,
    lineThickness: 0.05,
  }
}
