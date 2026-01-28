import * as THREE from 'three'

import type {
  AreaEntity,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'

import type {CoordinateTransformer} from './simulation-helpers'

export interface ObstacleSegment {
  areaId: string
  a: THREE.Vector3
  b: THREE.Vector3
  thickness: number
  height: number
}

export interface ObstaclePolygon {
  areaId: string
  points: THREE.Vector3[]
  height: number
}

export interface AreaPolygon {
  areaId: string
  points: THREE.Vector3[]
  bounds: THREE.Box3
}

export const createRng = (seed: number) => {
  let t = seed + 0x6d2b79f5
  return () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export const hashId = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const isPointInPolygon = (
  point: THREE.Vector3,
  polygon: THREE.Vector3[],
) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x
    const zi = polygon[i].z
    const xj = polygon[j].x
    const zj = polygon[j].z
    const intersect =
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi) + xi
    if (intersect) {
      inside = !inside
    }
  }
  return inside
}

export const distanceToSegment = (
  point: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
) => {
  const ab = new THREE.Vector3().subVectors(b, a)
  const ap = new THREE.Vector3().subVectors(point, a)
  const lengthSq = ab.x * ab.x + ab.z * ab.z
  if (lengthSq === 0) {
    return point.distanceTo(a)
  }
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.z * ab.z) / lengthSq))
  const projection = new THREE.Vector3(a.x + ab.x * t, 0, a.z + ab.z * t)
  return projection.distanceTo(new THREE.Vector3(point.x, 0, point.z))
}

export const getRandomPointInArea = (area: AreaPolygon, rng: () => number) => {
  for (let i = 0; i < 40; i += 1) {
    const x = THREE.MathUtils.lerp(area.bounds.min.x, area.bounds.max.x, rng())
    const z = THREE.MathUtils.lerp(area.bounds.min.z, area.bounds.max.z, rng())
    const candidate = new THREE.Vector3(x, 0, z)
    if (isPointInPolygon(candidate, area.points)) {
      return candidate
    }
  }
  return area.points[0]?.clone() ?? new THREE.Vector3(0, 0, 0)
}

export const buildAreaPolygons = (
  areas: AreaEntity[],
  transformer: CoordinateTransformer,
): Map<string, AreaPolygon> => {
  const map = new Map<string, AreaPolygon>()
  areas.forEach((area) => {
    const points = area.geometry.coordinates.map((point) =>
      transformer.toVector3(point, 0),
    )
    const bounds = new THREE.Box3().setFromPoints(points)
    map.set(area.id, {areaId: area.id, points, bounds})
  })
  return map
}

export const buildWallSegments = (
  walls: WallEntity[],
  transformer: CoordinateTransformer,
): ObstacleSegment[] => {
  const segments: ObstacleSegment[] = []
  walls.forEach((wall) => {
    for (let i = 0; i < wall.points.length - 1; i += 1) {
      const start = transformer.toVector3(wall.points[i], 0)
      const end = transformer.toVector3(wall.points[i + 1], 0)
      segments.push({
        areaId: wall.areaId,
        a: start,
        b: end,
        thickness: wall.thickness,
        height: wall.height,
      })
    }
  })
  return segments
}

export const buildAreaBoundarySegments = (
  areas: AreaEntity[],
  transformer: CoordinateTransformer,
) => {
  const segments: ObstacleSegment[] = []
  const boundaryThickness = DEFAULT_PERSON_RADIUS * 2
  areas.forEach((area) => {
    const points = area.geometry.coordinates.map((point) =>
      transformer.toVector3(point, 0),
    )
    if (points.length < 2) {
      return
    }
    for (let i = 0; i < points.length; i += 1) {
      const start = points[i]
      const end = points[(i + 1) % points.length]
      segments.push({
        areaId: area.id,
        a: start,
        b: end,
        thickness: boundaryThickness,
        height: Number.MAX_SAFE_INTEGER,
      })
    }
  })
  return segments
}

export const buildShapePolygons = (
  shapes: ShapeEntity[],
  transformer: CoordinateTransformer,
): ObstaclePolygon[] => {
  const polygons: ObstaclePolygon[] = []
  shapes.forEach((shape) => {
    if (shape.shapeType === 'line') {
      return
    }
    if (shape.geometry.length < 3) {
      return
    }
    const points = shape.geometry.map((point) =>
      transformer.toVector3(point, 0),
    )
    polygons.push({
      areaId: shape.areaId,
      points,
      height: shape.height ?? 0,
    })
  })
  return polygons
}
