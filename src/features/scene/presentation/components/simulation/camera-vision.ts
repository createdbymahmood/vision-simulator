import * as THREE from 'three'

import type {GeoPoint, SceneRoot} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'
import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'
import {
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
  isLineOfSightBlockedByObstacles,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'

import type {CoordinateTransformer} from './simulation-helpers'

import {isPointInPolygon} from './simulation-people-utils'

const PERSON_SAMPLE_COUNT = 8
const EARTH_RADIUS = 6378137

type FovObstaclesByArea = Map<
  string,
  ReturnType<typeof buildFovOcclusionObstacles>
>

export interface VisionPersonState {
  x: number
  y: number
  z: number
  height: number
  areaId: string
}

export interface VisionState {
  peopleWorld: Record<string, VisionPersonState>
  visibleByCameraId: Record<string, string[]>
  detectionsCount: number
  updatedAt: number
}

export const buildObstacleSegmentsByArea = (
  scene: SceneRoot,
  _transformer: CoordinateTransformer,
): FovObstaclesByArea => {
  const wallsByArea = new Map<string, typeof scene.walls>()
  scene.walls.forEach((wall) => {
    const existing = wallsByArea.get(wall.areaId)
    if (existing) {
      existing.push(wall)
      return
    }
    wallsByArea.set(wall.areaId, [wall])
  })

  const shapesByArea = new Map<string, typeof scene.shapes>()
  scene.shapes.forEach((shape) => {
    const existing = shapesByArea.get(shape.areaId)
    if (existing) {
      existing.push(shape)
      return
    }
    shapesByArea.set(shape.areaId, [shape])
  })

  const obstaclesByArea: FovObstaclesByArea = new Map()
  scene.areas.forEach((area) => {
    obstaclesByArea.set(
      area.id,
      buildFovOcclusionObstacles(
        wallsByArea.get(area.id) ?? [],
        shapesByArea.get(area.id) ?? [],
      ),
    )
  })

  return obstaclesByArea
}

const lngLatToMeters = (point: GeoPoint) => {
  const [lng, lat] = point
  const x = (EARTH_RADIUS * lng * Math.PI) / 180
  const y =
    EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  return {x, y}
}

const metersToLngLat = (x: number, y: number): GeoPoint => {
  const lng = (x / EARTH_RADIUS) * (180 / Math.PI)
  const lat =
    (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI)
  return [lng, lat]
}

const createWorldToGeoPoint = (origin: GeoPoint) => {
  const originMeters = lngLatToMeters(origin)
  return (world: THREE.Vector3): GeoPoint =>
    metersToLngLat(originMeters.x + world.x, originMeters.y - world.z)
}

const buildPersonSamplePoints = (
  person: VisionPersonState,
): THREE.Vector3[] => {
  const points = [new THREE.Vector3(person.x, 0, person.z)]
  for (let index = 0; index < PERSON_SAMPLE_COUNT; index += 1) {
    const angle = (index / PERSON_SAMPLE_COUNT) * Math.PI * 2
    points.push(
      new THREE.Vector3(
        person.x + Math.cos(angle) * DEFAULT_PERSON_RADIUS,
        0,
        person.z + Math.sin(angle) * DEFAULT_PERSON_RADIUS,
      ),
    )
  }
  return points
}

const isPersonInsideFovRing = (
  points: THREE.Vector3[],
  fovWorldRing: THREE.Vector3[],
) => {
  if (fovWorldRing.length < 3) {
    return false
  }

  return points.some((point) => isPointInPolygon(point, fovWorldRing))
}

export const computeCameraVisionState = ({
  scene,
  transformer,
  simulatedPeoplePositions,
  obstaclesByArea,
}: {
  scene: SceneRoot
  transformer: CoordinateTransformer
  simulatedPeoplePositions: Map<string, THREE.Vector3>
  obstaclesByArea: FovObstaclesByArea
}): VisionState => {
  const peopleWorld: Record<string, VisionPersonState> = {}
  const worldToGeoPoint = createWorldToGeoPoint(transformer.origin)
  const peopleSamples = new Map<
    string,
    {
      areaId: string
      height: number
      worldPoints: THREE.Vector3[]
      geoPoints: GeoPoint[]
    }
  >()
  scene.people.forEach((person) => {
    const override = simulatedPeoplePositions.get(person.id)
    const base = override ?? transformer.toVector3([person.x, person.y], 0)
    const worldState: VisionPersonState = {
      x: base.x,
      y: base.y,
      z: base.z,
      height: person.height,
      areaId: person.areaId,
    }
    peopleWorld[person.id] = {
      ...worldState,
    }
    const worldPoints = buildPersonSamplePoints(worldState)
    peopleSamples.set(person.id, {
      areaId: person.areaId,
      height: person.height,
      worldPoints,
      geoPoints: worldPoints.map((samplePoint) => worldToGeoPoint(samplePoint)),
    })
  })

  const visibleByCameraId: Record<string, string[]> = {}
  let detectionsCount = 0
  const areaById = new Map(scene.areas.map((area) => [area.id, area]))

  scene.cameras.forEach((camera) => {
    const direction = camera.ptz.pan
    const area = areaById.get(camera.areaId)
    const obstacles = obstaclesByArea.get(camera.areaId) ?? []
    const cameraOrigin: GeoPoint = [camera.x, camera.y]
    const fovRing = buildOccludedFovRing({
      origin: cameraOrigin,
      direction,
      fov: getEffectiveHorizontalFov(camera),
      depth: camera.depth,
      cameraHeight: camera.height,
      area,
      obstacles,
    })
    const fovWorldRing = fovRing.map((point) => transformer.toVector3(point, 0))

    const visible: string[] = []
    peopleSamples.forEach((person, personId) => {
      if (person.areaId !== camera.areaId) {
        return
      }
      if (!isPersonInsideFovRing(person.worldPoints, fovWorldRing)) {
        return
      }
      const hasVisibleSample = person.worldPoints.some((samplePoint, index) => {
        if (!isPointInPolygon(samplePoint, fovWorldRing)) {
          return false
        }
        return !isLineOfSightBlockedByObstacles({
          origin: cameraOrigin,
          target: person.geoPoints[index] ?? cameraOrigin,
          originHeight: camera.height,
          obstacles,
        })
      })
      if (hasVisibleSample) {
        visible.push(personId)
      }
    })
    if (visible.length > 0) {
      detectionsCount += visible.length
    }
    visibleByCameraId[camera.id] = visible
  })

  return {
    peopleWorld,
    visibleByCameraId,
    detectionsCount,
    updatedAt: Date.now(),
  }
}
