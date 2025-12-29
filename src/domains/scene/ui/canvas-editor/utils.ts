import type Konva from 'konva'

import type {CanvasPoint} from './types'

import {GRID_SIZE} from './constants'

export function toCanvas(
  point: CanvasPoint,
  offset: CanvasPoint,
  scale: number,
): CanvasPoint {
  return {
    x: offset.x + point.x * GRID_SIZE * scale,
    y: offset.y + point.y * GRID_SIZE * scale,
  }
}

export function lengthBetween(a: CanvasPoint, b: CanvasPoint): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function angleBetween(a: CanvasPoint, b: CanvasPoint): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return Math.round(angle * 10) / 10
}

export function snapPoint(point: CanvasPoint, enabled: boolean): CanvasPoint {
  if (!enabled) {
    return point
  }
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  }
}

export function pointFromStage(
  stage: Konva.Stage | null,
  offset: CanvasPoint,
  scale: number,
): CanvasPoint | null {
  if (!stage) {
    return null
  }
  const pointer = stage.getPointerPosition()
  if (!pointer) {
    return null
  }
  return {
    x: (pointer.x - offset.x) / (GRID_SIZE * scale),
    y: (pointer.y - offset.y) / (GRID_SIZE * scale),
  }
}
