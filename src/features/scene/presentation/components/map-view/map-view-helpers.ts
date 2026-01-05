import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Polygon,
} from 'geojson'

import {
  booleanPointInPolygon,
  destination,
  intersect,
  lineString,
  point,
  polygon,
  area as turfArea,
  length as turfLength,
} from '@turf/turf'

import type {
  AreaEntity,
  GeoPoint,
  PolygonGeometry,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {
  AREA_COLORS,
  DEFAULT_AREA_STYLE,
} from '@/features/scene/domain/constants/area-style'
import {
  SHAPE_FILL_COLOR,
  SHAPE_STROKE_COLOR,
} from '@/features/scene/domain/constants/shape-style'
import {DEFAULT_WALL_COLOR} from '@/features/scene/domain/constants/wall-style'

export const closeRing = (points: GeoPoint[]) => {
  if (points.length === 0) {
    return points
  }
  const [firstLng, firstLat] = points[0]
  const [lastLng, lastLat] = points[points.length - 1]
  if (firstLng === lastLng && firstLat === lastLat) {
    return points
  }
  return [...points, points[0]]
}

export const formatMeters = (meters: number) => `${meters.toFixed(1)} m`
export const formatArea = (squareMeters: number) =>
  `${squareMeters.toFixed(1)} m²`

export const computePerimeter = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return 0
  }
  const ring = closeRing(points)
  return turfLength(lineString(ring), {units: 'kilometers'}) * 1000
}

export const computeArea = (points: GeoPoint[]) => {
  if (points.length < 3) {
    return 0
  }
  const ring = closeRing(points)
  return turfArea(polygon([ring]))
}

export const computeSegmentLength = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return 0
  }
  return turfLength(lineString(points.slice(-2)), {units: 'kilometers'}) * 1000
}

export const projectPoint = (
  start: GeoPoint,
  bearingDegrees: number,
  distanceMeters: number,
): GeoPoint => {
  const dest = destination(
    point(start),
    distanceMeters / 1000,
    bearingDegrees,
    {
      units: 'kilometers',
    },
  )
  return dest.geometry.coordinates as GeoPoint
}

export const createPolygonGeometry = (points: GeoPoint[]): PolygonGeometry => ({
  type: 'polygon',
  coordinates: closeRing(points),
  bezierControls: [],
})

export const computeAngleDeg = (a: GeoPoint, b: GeoPoint) => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return (angle + 360) % 360
}

export const isPointInsideArea = (pointCoords: GeoPoint, area: AreaEntity) => {
  const ring = closeRing(area.geometry.coordinates)
  return booleanPointInPolygon(point(pointCoords), polygon([ring]))
}

export const createRectangleRing = (
  start: GeoPoint,
  end: GeoPoint,
  constrainSquare = false,
  fromCenter = false,
): GeoPoint[] => {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const side = constrainSquare
    ? Math.max(Math.abs(dx), Math.abs(dy))
    : undefined
  const width = constrainSquare
    ? Math.sign(dx || 1) * (side ?? Math.abs(dx))
    : dx
  const height = constrainSquare
    ? Math.sign(dy || 1) * (side ?? Math.abs(dy))
    : dy

  const origin = fromCenter
    ? [start[0] - width / 2, start[1] - height / 2]
    : start
  const [x, y] = origin
  const ring: GeoPoint[] = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ]
  return closeRing(ring)
}

export const createLineGeometry = (start: GeoPoint, end: GeoPoint) => [
  start,
  end,
]

export const createTriangleRing = (points: GeoPoint[]) =>
  points.length === 3 ? closeRing(points) : null

export const createEquilateralTriangleRing = (
  start: GeoPoint,
  end: GeoPoint,
): GeoPoint[] => {
  const sideLength = computeSegmentLength([start, end])
  const baseAngle = computeAngleDeg(start, end)
  const thirdPoint = projectPoint(start, baseAngle + 60, sideLength)
  return closeRing([start, end, thirdPoint])
}

export const createCircleRing = (
  center: GeoPoint,
  radiusMeters: number,
  segments = 64,
): GeoPoint[] => {
  const coords: GeoPoint[] = []
  for (let i = 0; i < segments; i += 1) {
    const bearing = (i / segments) * 360
    const dest = destination(point(center), radiusMeters / 1000, bearing, {
      units: 'kilometers',
    })
    coords.push(dest.geometry.coordinates as GeoPoint)
  }
  return closeRing(coords)
}

export const getNextAreaColor = (areas: AreaEntity[]) =>
  AREA_COLORS[areas.length % AREA_COLORS.length] ?? DEFAULT_AREA_STYLE.fillColor

export const buildAreaFeatureCollection = (
  areas: AreaEntity[],
  activeAreaId?: string,
) => ({
  type: 'FeatureCollection' as const,
  features: areas.map((area) => ({
    type: 'Feature' as const,
    properties: {
      id: area.id,
      color: area.style.fillColor,
      opacity: area.style.fillOpacity,
      borderColor: area.style.borderColor,
      isActive: area.id === activeAreaId,
      pointCount: area.pointCount,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [closeRing(area.geometry.coordinates)],
    },
  })),
})

export const getSafeRing = (coordinates: GeoPoint[]) => {
  if (!coordinates || coordinates.length < 4) {
    return null
  }
  const hasInvalid = coordinates.some(
    (coordinate) =>
      !coordinate ||
      !Number.isFinite(coordinate[0]) ||
      !Number.isFinite(coordinate[1]),
  )
  if (hasInvalid) {
    return null
  }
  return closeRing(coordinates)
}

export const buildOverlapFeatures = (
  areas: AreaEntity[],
): FeatureCollection | null => {
  if (areas.length < 2) {
    return null
  }
  const features: Feature[] = []
  areas.forEach((area, index) => {
    const baseRing = getSafeRing(area.geometry.coordinates)
    if (!baseRing) {
      return
    }
    const base = polygon([baseRing]) as Feature<Polygon, GeoJsonProperties>
    for (let i = index + 1; i < areas.length; i += 1) {
      const otherRing = getSafeRing(areas[i].geometry.coordinates)
      if (!otherRing) {
        continue
      }

      const other = polygon([otherRing])

      try {
        const overlap = intersect(base, other)
        if (overlap) {
          features.push(overlap as Feature)
        }
      } catch (error) {
        console.warn(
          'Skipping overlap calculation due to invalid geometry',
          error,
        )
      }
    }
  })
  return features.length > 0
    ? ({type: 'FeatureCollection', features} as FeatureCollection)
    : null
}

export const buildWallFeatures = (walls: WallEntity[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: walls
    .filter((wall) => wall.points.length >= 2)
    .map((wall) => ({
      type: 'Feature' as const,
      properties: {
        color: wall.color ?? DEFAULT_WALL_COLOR,
        thickness: wall.thickness,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: wall.points,
      },
    })),
})

export const buildWallVertexFeatures = (
  walls: WallEntity[],
): FeatureCollection => ({
  type: 'FeatureCollection',
  features: walls
    .filter((wall) => wall.points.length > 0)
    .flatMap((wall) =>
      wall.points.map((coordinate, index) => ({
        type: 'Feature' as const,
        properties: {
          color: wall.color ?? DEFAULT_WALL_COLOR,
          role: index === 0 ? 'start' : 'vertex',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: coordinate,
        },
      })),
    ),
})

export const buildShapeFeatures = (
  shapes: ShapeEntity[],
): FeatureCollection => ({
  type: 'FeatureCollection',
  features: shapes
    .filter((shape) => shape.geometry.length >= 2)
    .map((shape) => {
      const isLine = shape.shapeType === 'line'
      const geometry = isLine
        ? ({
            type: 'LineString',
            coordinates: shape.geometry,
          } as const)
        : ({
            type: 'Polygon',
            coordinates: [closeRing(shape.geometry)],
          } as const)
      return {
        type: 'Feature' as const,
        properties: {
          color: shape.color ?? SHAPE_STROKE_COLOR,
          shapeType: shape.shapeType,
        },
        geometry,
      }
    }),
})
