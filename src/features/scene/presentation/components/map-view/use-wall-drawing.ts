import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  GeoPoint,
  WallEntity,
} from '@/features/scene/domain/types'

import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'

import type {TooltipState} from './map-view-types'

import {
  computeAngleDeg,
  computePerimeter,
  computeSegmentLength,
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
  activeArea: AreaEntity | null
  addWall: (wall: Omit<WallEntity, 'id'>) => unknown
  isGeometryInsideArea: (points: GeoPoint[]) => boolean
}

interface WallPointerResult {
  tooltip?: TooltipState
  cursor?: string
}

export const useWallDrawing = ({
  activeArea,
  addWall,
  isGeometryInsideArea,
}: UseWallDrawingParams) => {
  const [wallDrawing, setWallDrawing] = React.useState<WallDrawingState>({
    isActive: false,
    points: [],
  })
  const [wallPreviewPath, setWallPreviewPath] = React.useState<GeoPoint[]>([])

  const resetWallDrawing = React.useCallback(() => {
    setWallDrawing({isActive: false, points: []})
    setWallPreviewPath([])
  }, [])

  const startWall = React.useCallback((point: GeoPoint) => {
    setWallDrawing({isActive: true, points: [point]})
  }, [])

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
    if (!wallDrawing.isActive || wallDrawing.points.length < 2 || !activeArea) {
      return false
    }
    if (!isGeometryInsideArea(wallDrawing.points)) {
      toast.error('Walls must stay inside the active area')
      resetWallDrawing()
      return false
    }
    addWall({
      areaId: activeArea.id,
      points: wallDrawing.points,
      color: DEFAULT_WALL_COLOR,
      height: 3,
      thickness: DEFAULT_WALL_THICKNESS,
      type: 'wall',
    })
    resetWallDrawing()
    return true
  }, [
    activeArea,
    addWall,
    isGeometryInsideArea,
    resetWallDrawing,
    wallDrawing.isActive,
    wallDrawing.points,
  ])

  const handleWallPointerMove = React.useCallback(
    (point: GeoPoint, screen: PointerPosition): WallPointerResult | null => {
      if (!wallDrawing.isActive) {
        setWallPreviewPath([])
        return null
      }
      const preview = [...wallDrawing.points, point]
      if (!isGeometryInsideArea(preview)) {
        setWallPreviewPath([])
        return {
          cursor: 'not-allowed',
          tooltip: {
            text: 'Walls must stay inside the active area',
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }
      setWallPreviewPath(preview)
      const segmentLength = computeSegmentLength(preview)
      const totalLength = computePerimeter(preview)
      return {
        tooltip: {
          text: `${formatMeters(segmentLength)} • ${angle.toFixed(0)}° • Total: ${formatMeters(totalLength)}`,
          x: screen.x + 12,
          y: screen.y + 12,
          visible: true,
        },
      }
    },
    [isGeometryInsideArea, wallDrawing],
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
