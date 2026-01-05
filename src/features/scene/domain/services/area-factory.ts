import type {AreaEntity, PolygonGeometry} from '../types'

import {AREA_COLORS, DEFAULT_AREA_STYLE} from '../constants/area-style'

const getNextAreaId = (areas: AreaEntity[]) => {
  const suffixes = areas
    .map((area) => Number.parseInt(area.id.split('-')[1] ?? '0', 10))
    .filter((value) => Number.isFinite(value))
  const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0
  return `area-${maxSuffix + 1}`
}

const getNextAreaName = (areas: AreaEntity[]) => {
  const suffixes = areas
    .map((area) => Number.parseInt(area.name.split('area-')[1] ?? '0', 10))
    .filter((value) => Number.isFinite(value))
  const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0
  return `area-${maxSuffix + 1}`
}

const getAreaColor = (areas: AreaEntity[]) =>
  AREA_COLORS[areas.length % AREA_COLORS.length] ?? DEFAULT_AREA_STYLE.fillColor

export const createAreaEntity = (
  existingAreas: AreaEntity[],
  geometry: PolygonGeometry,
): AreaEntity => ({
  id: getNextAreaId(existingAreas),
  type: 'area',
  name: getNextAreaName(existingAreas),
  geometry,
  pointCount:
    geometry.bezierControls.length > 0
      ? geometry.bezierControls.length
      : geometry.coordinates.length > 0
        ? geometry.coordinates.length - 1
        : 0,
  color: getAreaColor(existingAreas),
  style: {
    ...DEFAULT_AREA_STYLE,
    fillColor: getAreaColor(existingAreas),
    borderColor: getAreaColor(existingAreas),
  },
  boundaryMode: 'strict',
})
