import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  PersonEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/types/types'

import {closeRing, isPointInsideArea} from './map-view-helpers'

export type SelectableEntity =
  | AreaEntity
  | CameraEntity
  | PersonEntity
  | ShapeEntity
  | WallEntity

export type SelectableEntityType = SelectableEntity['type']

export interface Bounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export const HIT_TEST_PRIORITY: SelectableEntityType[] = [
  'person',
  'camera',
  'wall',
  'shape',
  'area',
]

const dropClosingPoint = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return points
  }
  const [firstLng, firstLat] = points[0]
  const [lastLng, lastLat] = points[points.length - 1]
  if (firstLng === lastLng && firstLat === lastLat) {
    return points.slice(0, -1)
  }
  return points
}

export const getEntityPoints = (entity: SelectableEntity): GeoPoint[] => {
  switch (entity.type) {
    case 'area':
      return dropClosingPoint(entity.geometry.coordinates)
    case 'wall':
      return entity.points
    case 'shape':
      return entity.geometry
    case 'camera':
    case 'person':
      return [[entity.x, entity.y]]
    default:
      return []
  }
}

export const computeBounds = (points: GeoPoint[]): Bounds | null => {
  const cleanPoints = dropClosingPoint(points)
  if (cleanPoints.length === 0) {
    return null
  }
  let minLng = Number.POSITIVE_INFINITY
  let maxLng = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  cleanPoints.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat)
  ) {
    return null
  }

  return {minLng, maxLng, minLat, maxLat}
}

export const boundsToPolygon = (bounds: Bounds): GeoPoint[] =>
  closeRing([
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
    [bounds.minLng, bounds.maxLat],
  ])

export const getBoundsCenter = (bounds: Bounds): GeoPoint => [
  (bounds.minLng + bounds.maxLng) / 2,
  (bounds.minLat + bounds.maxLat) / 2,
]

export const translatePoints = (
  points: GeoPoint[],
  deltaLng: number,
  deltaLat: number,
) => points.map(([lng, lat]) => [lng + deltaLng, lat + deltaLat] as GeoPoint)

export const rotatePoints = (
  points: GeoPoint[],
  center: GeoPoint,
  angleDeg: number,
) => {
  const radians = (angleDeg * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return points.map(([lng, lat]) => {
    const dx = lng - center[0]
    const dy = lat - center[1]
    const rotatedLng = dx * cos - dy * sin + center[0]
    const rotatedLat = dx * sin + dy * cos + center[1]
    return [rotatedLng, rotatedLat] as GeoPoint
  })
}

export const scalePoints = (
  points: GeoPoint[],
  anchor: GeoPoint,
  scaleX: number,
  scaleY: number,
) =>
  points.map(([lng, lat]) => {
    const dx = lng - anchor[0]
    const dy = lat - anchor[1]
    return [anchor[0] + dx * scaleX, anchor[1] + dy * scaleY] as GeoPoint
  })

export const isGeometryInsideArea = (points: GeoPoint[], area?: AreaEntity) => {
  if (!area) {
    return true
  }
  return dropClosingPoint(points).every((point) =>
    isPointInsideArea(point, area),
  )
}
