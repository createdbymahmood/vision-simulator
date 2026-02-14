/* eslint-disable max-lines-per-function, max-statements, complexity */
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
import type {ShapeDrawMode} from '@/features/scene/presentation/types'

import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

import type {TooltipState} from './map-view-types'

import {
  computeAngleDeg,
  computeSegmentLength,
  createCircleRing,
  createLineGeometry,
  createRectangleRing,
  createTriangleRing,
  doesShapeCollideWithWalls,
  doesShapeHitPerson,
  formatMeters,
} from './map-view-helpers'

interface ShapeDrawingState {
  isActive: boolean
  start?: GeoPoint
  points: GeoPoint[]
}

interface PointerPosition {
  x: number
  y: number
}

interface Modifiers {
  shiftKey: boolean
  altKey: boolean
}

interface UseShapeDrawingParams {
  addShape: (shape: Omit<ShapeEntity, 'id'>) => SceneRoot
  getAreaForPoint: (point: GeoPoint) => AreaEntity | null
  isGeometryInsideArea: (points: GeoPoint[], area: AreaEntity | null) => boolean
  strokeColor: string
  people: PersonEntity[]
  walls: WallEntity[]
}

interface ShapePointerResult {
  tooltip?: TooltipState
  cursor?: string
}

export const useShapeDrawing = ({
  addShape,
  getAreaForPoint,
  isGeometryInsideArea,
  strokeColor,
  people,
  walls,
}: UseShapeDrawingParams) => {
  const {recordAction} = useHistoryRecorder()
  const [shapeDrawing, setShapeDrawing] = React.useState<ShapeDrawingState>({
    isActive: false,
    start: undefined,
    points: [],
  })
  const [shapePreview, setShapePreview] = React.useState<GeoPoint[] | null>(
    null,
  )
  const [targetArea, setTargetArea] = React.useState<AreaEntity | null>(null)

  const resetShapeDrawing = React.useCallback(() => {
    setShapeDrawing({isActive: false, start: undefined, points: []})
    setShapePreview(null)
    setTargetArea(null)
  }, [])

  const startShape = React.useCallback(
    (point: GeoPoint) => {
      const area = getAreaForPoint(point)
      if (!area) {
        toast.info('Place shapes inside an area')
        return
      }
      setTargetArea(area)
      setShapeDrawing({isActive: true, start: point, points: [point]})
    },
    [getAreaForPoint],
  )

  const handleShapePointerMove = React.useCallback(
    (
      point: GeoPoint,
      screen: PointerPosition,
      shapeMode: ShapeDrawMode,
      modifiers: Modifiers,
    ): ShapePointerResult | null => {
      if (!shapeDrawing.isActive) {
        setShapePreview(null)
        return null
      }
      if (!targetArea) {
        setShapePreview(null)
        return null
      }

      let preview: GeoPoint[] | null = null
      if (shapeMode === 'rectangle' && shapeDrawing.start) {
        preview = createRectangleRing(
          shapeDrawing.start,
          point,
          modifiers.shiftKey,
          modifiers.altKey,
        )
        const xs = preview.map((coord) => coord[0])
        const ys = preview.map((coord) => coord[1])
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const width = computeSegmentLength([
          [minX, minY],
          [maxX, minY],
        ])
        const height = computeSegmentLength([
          [minX, minY],
          [minX, maxY],
        ])
        const text = `W: ${formatMeters(width)} × H: ${formatMeters(height)}${modifiers.shiftKey ? ' (square)' : ''}`
        if (!isGeometryInsideArea(preview, targetArea)) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Shapes must stay inside an area',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeCollideWithWalls(
            {geometry: preview, shapeType: 'rectangle'} as ShapeEntity,
            walls.filter((wall) => wall.areaId === targetArea.id),
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over walls',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeHitPerson(
            {geometry: preview, shapeType: 'rectangle'} as ShapeEntity,
            people,
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over people',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        setShapePreview(preview)
        return {
          tooltip: {
            text,
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }

      if (shapeMode === 'circle' && shapeDrawing.start) {
        const radiusMeters = computeSegmentLength([shapeDrawing.start, point])
        preview = createCircleRing(shapeDrawing.start, radiusMeters)
        if (!isGeometryInsideArea(preview, targetArea)) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Shapes must stay inside an area',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeCollideWithWalls(
            {geometry: preview, shapeType: 'circle'} as ShapeEntity,
            walls.filter((wall) => wall.areaId === targetArea.id),
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over walls',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeHitPerson(
            {geometry: preview, shapeType: 'circle'} as ShapeEntity,
            people,
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over people',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        setShapePreview(preview)
        return {
          tooltip: {
            text: `Radius: ${formatMeters(radiusMeters)} • Diameter: ${formatMeters(radiusMeters * 2)}`,
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }

      if (shapeMode === 'line' && shapeDrawing.start) {
        preview = createLineGeometry(shapeDrawing.start, point)
        if (!isGeometryInsideArea(preview, targetArea)) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Shapes must stay inside an area',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeCollideWithWalls(
            {geometry: preview, shapeType: 'line'} as ShapeEntity,
            walls.filter((wall) => wall.areaId === targetArea.id),
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over walls',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        if (
          doesShapeHitPerson(
            {geometry: preview, shapeType: 'line'} as ShapeEntity,
            people,
          )
        ) {
          setShapePreview(null)
          return {
            cursor: 'not-allowed',
            tooltip: {
              text: 'Cannot draw shapes over people',
              x: screen.x + 12,
              y: screen.y + 12,
              visible: true,
            },
          }
        }
        const angle = computeAngleDeg(shapeDrawing.start, point)
        const len = computeSegmentLength([shapeDrawing.start, point])
        setShapePreview(preview)
        return {
          tooltip: {
            text: `${formatMeters(len)} • ${angle.toFixed(0)}°`,
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
        }
      }

      if (shapeMode === 'triangle') {
        const points = [...shapeDrawing.points, point]
        if (points.length === 2) {
          preview = createLineGeometry(points[0], points[1])
        }
        if (points.length === 3) {
          preview = createTriangleRing(points)
        }
        const isTrianglePolygon = Boolean(preview && preview.length >= 4)
        const isValid =
          preview && isTrianglePolygon
            ? isGeometryInsideArea(preview, targetArea)
            : true
        const hitsPerson =
          preview &&
          isTrianglePolygon &&
          doesShapeHitPerson(
            {geometry: preview, shapeType: 'triangle'} as ShapeEntity,
            people,
          )
        const hitsWall =
          preview &&
          isTrianglePolygon &&
          doesShapeCollideWithWalls(
            {geometry: preview, shapeType: 'triangle'} as ShapeEntity,
            walls.filter((wall) => wall.areaId === targetArea.id),
          )
        setShapePreview(preview)
        return {
          tooltip: {
            text: `Triangle vertices: ${points.length}/3`,
            x: screen.x + 12,
            y: screen.y + 12,
            visible: true,
          },
          cursor:
            isValid && !hitsPerson && !hitsWall ? undefined : 'not-allowed',
        }
      }

      setShapePreview(preview)
      return null
    },
    [isGeometryInsideArea, people, shapeDrawing, targetArea, walls],
  )

  const finalizeShape = React.useCallback(
    (end: GeoPoint, shapeMode: ShapeDrawMode) => {
      if (!shapeDrawing.isActive || !shapeDrawing.start || !targetArea) {
        return null
      }
      let geometry: GeoPoint[] = []
      const previewGeometry = shapePreview
      const canUsePreviewGeometry = Boolean(
        previewGeometry &&
          previewGeometry.length > 0 &&
          (shapeMode !== 'triangle' || previewGeometry.length >= 4),
      )

      if (canUsePreviewGeometry) {
        geometry = previewGeometry
      } else {
        if (shapeMode === 'rectangle') {
          geometry = createRectangleRing(shapeDrawing.start, end)
        } else if (shapeMode === 'circle') {
          const radiusMeters = computeSegmentLength([shapeDrawing.start, end])
          geometry = createCircleRing(shapeDrawing.start, radiusMeters)
        } else if (shapeMode === 'line') {
          geometry = createLineGeometry(shapeDrawing.start, end)
        }

        if (shapeMode === 'triangle') {
          const nextPoints = [...shapeDrawing.points, end]
          if (nextPoints.length < 3) {
            setShapeDrawing({
              isActive: true,
              start: shapeDrawing.start,
              points: nextPoints,
            })
            return null
          }
          const ring = createTriangleRing(nextPoints.slice(0, 3))
          geometry = ring ?? []
        }
      }

      if (geometry.length === 0) {
        setShapeDrawing({isActive: false, start: undefined, points: []})
        return null
      }

      if (!isGeometryInsideArea(geometry, targetArea)) {
        toast.error('Shapes must stay inside an area')
        resetShapeDrawing()
        return null
      }
      const peopleInArea = people.filter(
        (person) => person.areaId === targetArea.id,
      )
      const wallsInArea = walls.filter((wall) => wall.areaId === targetArea.id)
      if (
        doesShapeCollideWithWalls(
          {geometry, shapeType: shapeMode} as ShapeEntity,
          wallsInArea,
        )
      ) {
        toast.error('Cannot draw shapes over walls')
        resetShapeDrawing()
        return null
      }
      if (
        doesShapeHitPerson(
          {geometry, shapeType: shapeMode} as ShapeEntity,
          peopleInArea,
        )
      ) {
        toast.error('Cannot draw shapes over people')
        resetShapeDrawing()
        return null
      }

      const updated = addShape({
        areaId: targetArea.id,
        geometry,
        shapeType: shapeMode,
        height: 0,
        color: strokeColor,
        type: 'shape',
      })
      recordAction({type: 'add', entity: 'shape'}, updated)
      resetShapeDrawing()
      return updated
    },
    [
      addShape,
      isGeometryInsideArea,
      people,
      recordAction,
      resetShapeDrawing,
      shapeDrawing.isActive,
      shapeDrawing.points,
      shapeDrawing.start,
      shapePreview,
      strokeColor,
      targetArea,
      walls,
    ],
  )

  const backspaceShape = React.useCallback(() => {
    resetShapeDrawing()
  }, [resetShapeDrawing])

  return {
    shapeDrawing,
    shapePreview,
    startShape,
    finalizeShape,
    handleShapePointerMove,
    resetShapeDrawing,
    backspaceShape,
  }
}
