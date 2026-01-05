import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
} from 'geojson'

import {
  intersect,
  lineString,
  polygon,
  area as turfArea,
  length as turfLength,
} from '@turf/turf'

import type {
  AreaEntity,
  GeoPoint,
  PolygonGeometry,
} from '@/features/scene/domain/types'

import {
  AREA_COLORS,
  DEFAULT_AREA_STYLE,
} from '@/features/scene/domain/constants/area-style'

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

export const createPolygonGeometry = (points: GeoPoint[]): PolygonGeometry => ({
  type: 'polygon',
  coordinates: closeRing(points),
  bezierControls: [],
})

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
    (point) =>
      !point || !Number.isFinite(point[0]) || !Number.isFinite(point[1]),
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
    const base = polygon([baseRing]) as unknown as FeatureCollection<
      MultiPolygon | Polygon,
      GeoJsonProperties
    >
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
      } catch {
        /* swallow invalid geometry */
      }
    }
  })
  return features.length > 0
    ? ({type: 'FeatureCollection', features} as FeatureCollection)
    : null
}
