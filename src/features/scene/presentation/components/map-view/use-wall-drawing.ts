import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  GeoPoint,
  PersonEntity,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

import type {TooltipState} from './map-view-types'

import {
  computeAngleDeg,
  computePerimeter,
  computeSegmentLength,
  doesWallCollideWithShapes,
  doesWallPathHitPerson,
  formatMeters,
} from './map-view-helpers'

interface WallDrawingState {
  isActive: boolean
  points: GeoPoint[]
}

interface PointerPosition {
  x: number
  y: number
}

interface UseWallDrawingParams {
  addWall: (wall: Omit<WallEntity, 'id'>) => SceneRoot
  getAreaForPoint: (point: GeoPoint) => AreaEntity | null
  isGeometryInsideArea: (points: GeoPoint[], area: AreaEntity | null) => boolean
  people: PersonEntity[]
  shapes: ShapeEntity[]
}

interface WallPointerResult {
  tooltip?: TooltipState
  cursor?: string
}

// eslint-disable-next-line max-lines-per-function
export const useWallDrawing = ({
  addWall,
  getAreaForPoint,
  isGeometryInsideArea,
  people,
  shapes,
}: UseWallDrawingParams) => {
  const {recordAction} = useHistoryRecorder()
  const [wallDrawing, setWallDrawing] = React.useState<WallDrawingState>({
    isActive: false,
    points: [],
  })
  const [wallPreviewPath, setWallPreviewPath] = React.useState<GeoPoint[]>([])
  const [targetArea, setTargetArea] = React.useState<AreaEntity | null>(null)

  const resetWallDrawing = React.useCallback(() => {
    setWallDrawing({isActive: false, points: []})
    setWallPreviewPath([])
    setTargetArea(null)
  }, [])

  const startWall = React.useCallback(
    (point: GeoPoint) => {
      const area = getAreaForPoint(point)
      if (!area) {
        toast.info('Place walls inside an area')
        return
      }
      setTargetArea(area)
      setWallDrawing({isActive: true, points: [point]})
    },
    [getAreaForPoint],
  )

  const appendWallPoint = React.useCallback((point: GeoPoint) => {
    setWallDrawing((prev) => ({...prev, points: [...prev.points, point]}))
  }, [])

  const popWallPoint = React.useCallback(() => {
    setWallDrawing((prev) => {
      const nextPoints = prev.points.slice(0, -1)
      return {isActive: nextPoints.length > 0, points: nextPoints}
    })
  }, [])

  const finalizeWall = React.useCallback(() => {
    if (!wallDrawing.isActive || wallDrawing.points.length < 2 || !targetArea) {
      return null
    }
    if (!isGeometryInsideArea(wallDrawing.points, targetArea)) {
      toast.error('Walls must stay inside an area')
      resetWallDrawing()
      return null
    }
    if (
      doesWallPathHitPerson(wallDrawing.points, people, DEFAULT_WALL_THICKNESS)
    ) {
      toast.error('Cannot draw walls over people')
      resetWallDrawing()
      return null
    }
    if (
      doesWallCollideWithShapes(
        wallDrawing.points,
        shapes.filter((shape) => shape.areaId === targetArea.id),
        DEFAULT_WALL_THICKNESS,
      )
    ) {
      toast.error('Cannot draw walls over shapes')
      resetWallDrawing()
      return null
    }
    const updated = addWall({
      areaId: targetArea.id,
      points: wallDrawing.points,
      color: DEFAULT_WALL_COLOR,
      height: 3,
      thickness: DEFAULT_WALL_THICKNESS,
      type: 'wall',
    })
    recordAction({type: 'add', entity: 'wall'}, updated)
    resetWallDrawing()
    return updated
  }, [
    addWall,
    isGeometryInsideArea,
    people,
    recordAction,
    resetWallDrawing,
    shapes,
    targetArea,
    wallDrawing.isActive,
    wallDrawing.points,
  ])

  const handleWallPointerMove = React.useCallback(
    (point: GeoPoint, screen: PointerPosition): WallPointerResult | null => {
      if (!wallDrawing.isActive) {
        setWallPreviewPath([])
        return null
      }
      if (!targetArea) {
        return null
      }
      const preview = [...wallDrawing.points, point]
      if (!isGeometryInsideArea(preview, targetArea)) {
        setWallPreviewPath([])
        return {
          cursor: 'not-allowed',
          tooltip: {
            text: 'Walls must stay inside an area',
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }
      if (doesWallPathHitPerson(preview, people, DEFAULT_WALL_THICKNESS)) {
        setWallPreviewPath([])
        return {
          cursor: 'not-allowed',
          tooltip: {
            text: 'Cannot draw walls over people',
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }
      if (
        doesWallCollideWithShapes(
          preview,
          shapes.filter((shape) => shape.areaId === targetArea.id),
          DEFAULT_WALL_THICKNESS,
        )
      ) {
        setWallPreviewPath([])
        return {
          cursor: 'not-allowed',
          tooltip: {
            text: 'Cannot draw walls over shapes',
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }
      setWallPreviewPath(preview)
      const segmentLength = computeSegmentLength(preview)
      const totalLength = computePerimeter(preview)
      const angle = computeAngleDeg(
        wallDrawing.points[wallDrawing.points.length - 1],
        point,
      )
      return {
        tooltip: {
          text: `${formatMeters(segmentLength)} • ${angle.toFixed(0)}° • Total: ${formatMeters(totalLength)}`,
          x: screen.x + 12,
          y: screen.y + 12,
          visible: true,
        },
      }
    },
    [isGeometryInsideArea, people, shapes, targetArea, wallDrawing],
  )

  return {
    wallDrawing,
    wallPreviewPath,
    startWall,
    appendWallPoint,
    popWallPoint,
    finalizeWall,
    resetWallDrawing,
    handleWallPointerMove,
  }
}
