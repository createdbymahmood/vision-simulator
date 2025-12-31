import type {SceneEntityKind, SceneTool} from '../../../core/scene-types'
import type {CanvasPoint} from '../types'

import {GRID_SIZE} from '../constants'

export const computeCursor = (
  editMode: boolean,
  activeTool: SceneTool,
  isPanning: boolean,
  isPanTool: boolean,
) => {
  if (!editMode) {
    return 'not-allowed'
  }
  if (activeTool === 'wall' || activeTool === 'shape') {
    return 'crosshair'
  }
  if (isPanTool) {
    return isPanning ? 'grabbing' : 'grab'
  }
  return 'default'
}

export const selectionBoxToPixels = (
  selectionBox: {start: CanvasPoint; end: CanvasPoint} | null,
  offset: CanvasPoint,
  scale: number,
) => {
  if (!selectionBox) {
    return null
  }
  const start = {
    x: selectionBox.start.x * GRID_SIZE * scale + offset.x,
    y: selectionBox.start.y * GRID_SIZE * scale + offset.y,
  }
  const end = {
    x: selectionBox.end.x * GRID_SIZE * scale + offset.x,
    y: selectionBox.end.y * GRID_SIZE * scale + offset.y,
  }
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  return {left, top, width, height}
}

export const withinSelectionBounds = (
  selectionBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } | null,
  point: CanvasPoint,
) =>
  Boolean(
    selectionBounds &&
      point.x >= selectionBounds.minX &&
      point.x <= selectionBounds.maxX &&
      point.y >= selectionBounds.minY &&
      point.y <= selectionBounds.maxY,
  )

export const resolveSelectedEntities = (selection: {
  selectedEntities: {id: string; kind: SceneEntityKind}[]
  selectedEntityId: string | null
  selectedEntityKind: SceneEntityKind | null
}) =>
  selection.selectedEntities.length
    ? selection.selectedEntities
    : selection.selectedEntityId && selection.selectedEntityKind
      ? [{id: selection.selectedEntityId, kind: selection.selectedEntityKind}]
      : []
