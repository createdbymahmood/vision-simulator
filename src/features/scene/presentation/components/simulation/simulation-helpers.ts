import * as THREE from 'three'

import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  PersonEntity,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {closeRing} from '../map-view/map-view-helpers'
import {computeBounds} from '../map-view/selection-geometry'

const EARTH_RADIUS = 6378137
const GEO_POINT_EPSILON = 1e-10

export interface CoordinateTransformer {
  toVector3: (point: GeoPoint, y?: number) => THREE.Vector3
  toFlat: (point: GeoPoint) => {x: number; z: number}
  toGeoPoint: (point: THREE.Vector3 | {x: number; z: number}) => GeoPoint
  origin: GeoPoint
}

export type WorldEntity =
  | {type: 'area'; entity: AreaEntity; points: THREE.Vector3[]; dimmed: boolean}
  | {
      type: 'camera'
      entity: CameraEntity
      position: THREE.Vector3
      dimmed: boolean
    }
  | {
      type: 'person'
      entity: PersonEntity
      position: THREE.Vector3
      dimmed: boolean
    }
  | {
      type: 'shape'
      entity: ShapeEntity
      points: THREE.Vector3[]
      dimmed: boolean
      renderOrder: number
    }
  | {
      type: 'wall'
      entity: WallEntity
      start: THREE.Vector3
      end: THREE.Vector3
      length: number
      dimmed: boolean
      segmentIndex: number
    }

export const closeRingVectors = (points: THREE.Vector3[]) => {
  if (points.length === 0) {
    return points
  }
  const first = points[0]
  const last = points[points.length - 1]
  if (first.x === last.x && first.z === last.z) {
    return points
  }
  return [...points, first.clone()]
}

const areGeoPointsEqual = (a: GeoPoint, b: GeoPoint) =>
  Math.abs(a[0] - b[0]) <= GEO_POINT_EPSILON &&
  Math.abs(a[1] - b[1]) <= GEO_POINT_EPSILON

export const getLineShapeGeometryEndpoints = (points: GeoPoint[]) => {
  if (points.length < 2) {
    return points
  }
  const start = points[0]
  const end =
    points.find(
      (point, index) => index > 0 && !areGeoPointsEqual(point, start),
    ) ?? points[points.length - 1]
  if (!end) {
    return [start]
  }
  return [start, end]
}

export const parseColorAndAlpha = (
  value?: string,
): {color?: string; alpha: number} => {
  if (!value) {
    return {color: undefined, alpha: 1}
  }
  const hexMatch = value.startsWith('#') ? value.slice(1) : value
  if (hexMatch.length === 8) {
    const rgb = `#${hexMatch.slice(0, 6)}`
    const alpha = parseInt(hexMatch.slice(6, 8), 16) / 255
    return {color: rgb, alpha: Number.isFinite(alpha) ? alpha : 1}
  }
  const rgba = value.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  )
  if (rgba) {
    const [, r, g, b, a] = rgba
    const alpha = a ? Number.parseFloat(a) : 1
    return {
      color: `rgb(${r}, ${g}, ${b})`,
      alpha: Number.isFinite(alpha) ? alpha : 1,
    }
  }
  return {color: value, alpha: 1}
}

export const computeSceneOrigin = (scene: SceneRoot): GeoPoint => {
  const points: GeoPoint[] = []
  scene.areas.forEach((area) => points.push(...area.geometry.coordinates))
  scene.shapes.forEach((shape) => points.push(...shape.geometry))
  scene.walls.forEach((wall) => points.push(...wall.points))
  scene.people.forEach((person) => points.push([person.x, person.y]))
  scene.cameras.forEach((camera) => points.push([camera.x, camera.y]))
  const bounds = computeBounds(points)
  if (bounds) {
    const toMeters = (point: GeoPoint) => {
      const [lng, lat] = point
      const x = (EARTH_RADIUS * lng * Math.PI) / 180
      const y =
        EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
      return {x, y}
    }
    const fromMeters = (x: number, y: number): GeoPoint => {
      const lng = (x / EARTH_RADIUS) * (180 / Math.PI)
      const lat =
        (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) *
        (180 / Math.PI)
      return [lng, lat]
    }
    const minMeters = toMeters([bounds.minLng, bounds.minLat])
    const maxMeters = toMeters([bounds.maxLng, bounds.maxLat])
    const centerMeters = {
      x: (minMeters.x + maxMeters.x) / 2,
      y: (minMeters.y + maxMeters.y) / 2,
    }
    return fromMeters(centerMeters.x, centerMeters.y)
  }
  return [scene.origin.lng, scene.origin.lat]
}

export const createCoordinateTransformer = (
  origin: GeoPoint,
): CoordinateTransformer => {
  const metersToLngLat = (x: number, y: number): GeoPoint => {
    const lng = (x / EARTH_RADIUS) * (180 / Math.PI)
    const lat =
      (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) *
      (180 / Math.PI)
    return [lng, lat]
  }

  const lngLatToMeters = (point: GeoPoint) => {
    const [lng, lat] = point
    const x = (EARTH_RADIUS * lng * Math.PI) / 180
    const y =
      EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
    return {x, y}
  }
  const originMeters = lngLatToMeters(origin)
  const toFlat = (point: GeoPoint) => {
    const merc = lngLatToMeters(point)
    return {
      x: merc.x - originMeters.x,
      z: -(merc.y - originMeters.y),
    }
  }
  const toVector3 = (point: GeoPoint, y = 0) => {
    const flat = toFlat(point)
    return new THREE.Vector3(flat.x, y, flat.z)
  }
  const toGeoPoint = (point: THREE.Vector3 | {x: number; z: number}) =>
    metersToLngLat(originMeters.x + point.x, originMeters.y - point.z)
  return {toVector3, toFlat, toGeoPoint, origin}
}

export const transformAreaFeatureCollectionsToThreeJSShapes = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  isDimmed: (areaId?: string) => boolean,
): WorldEntity[] =>
  scene.areas.map((area) => ({
    type: 'area',
    entity: area,
    points: closeRing(area.geometry.coordinates).map((pt) =>
      transformer.toVector3(pt),
    ),
    dimmed: isDimmed(area.id),
  }))

export const transformWallFeatureCollectionsToThreeJSShapes = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  isDimmed: (areaId?: string) => boolean,
): WorldEntity[] =>
  scene.walls
    .filter((wall) => scene.areas.some((area) => area.id === wall.areaId))
    .flatMap((wall) => {
      const segments: WorldEntity[] = []
      for (let index = 0; index < wall.points.length - 1; index += 1) {
        const startPoint = wall.points[index]
        const endPoint = wall.points[index + 1]
        const start = transformer.toVector3(startPoint)
        const end = transformer.toVector3(endPoint)
        segments.push({
          type: 'wall',
          entity: wall,
          start,
          end,
          length: start.distanceTo(end),
          dimmed: isDimmed(wall.areaId),
          segmentIndex: index,
        })
      }
      return segments
    })

export const transformShapeFeatureCollectionsToThreeJSShapes = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  isDimmed: (areaId?: string) => boolean,
): WorldEntity[] =>
  scene.shapes
    .filter((shape) => scene.areas.some((area) => area.id === shape.areaId))
    .map((shape, index) => ({
      type: 'shape',
      entity: shape,
      points:
        shape.shapeType === 'line'
          ? getLineShapeGeometryEndpoints(shape.geometry).map((point) =>
              transformer.toVector3(point),
            )
          : closeRing(shape.geometry).map((point) =>
              transformer.toVector3(point),
            ),
      dimmed: isDimmed(shape.areaId),
      renderOrder: 10 + index,
    }))

export const transformPeopleFeatureCollectionsToThreeJSShape = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  isDimmed: (areaId?: string) => boolean,
): WorldEntity[] =>
  scene.people
    .filter((person) => scene.areas.some((area) => area.id === person.areaId))
    .map((person) => ({
      type: 'person',
      entity: person,
      position: transformer.toVector3([person.x, person.y], person.height / 2),
      dimmed: isDimmed(person.areaId),
    }))

export const transformCameraFeatureCollectionsToThreeJSShape = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  isDimmed: (areaId?: string) => boolean,
): WorldEntity[] =>
  scene.cameras
    .filter((camera) => scene.areas.some((area) => area.id === camera.areaId))
    .map((camera) => ({
      type: 'camera',
      entity: camera,
      position: transformer.toVector3([camera.x, camera.y], 0),
      dimmed: isDimmed(camera.areaId),
    }))

export const transformFeatureCollectionsToThreeJSShapes = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
  focusAreaId?: string,
): WorldEntity[] => {
  const dimId = focusAreaId
  const isDimmed = (areaId?: string) =>
    Boolean(dimId && areaId && dimId !== areaId)

  return [
    ...transformAreaFeatureCollectionsToThreeJSShapes(
      scene,
      transformer,
      isDimmed,
    ),
    ...transformWallFeatureCollectionsToThreeJSShapes(
      scene,
      transformer,
      isDimmed,
    ),
    ...transformShapeFeatureCollectionsToThreeJSShapes(
      scene,
      transformer,
      isDimmed,
    ),
    ...transformCameraFeatureCollectionsToThreeJSShape(
      scene,
      transformer,
      isDimmed,
    ),
    ...transformPeopleFeatureCollectionsToThreeJSShape(
      scene,
      transformer,
      isDimmed,
    ),
  ]
}
