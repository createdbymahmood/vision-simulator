import * as THREE from 'three'

import type {SceneRoot} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'
import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'
import {
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'

import type {CoordinateTransformer} from './simulation-helpers'

import {isPointInPolygon} from './simulation-people-utils'

const PERSON_SAMPLE_COUNT = 8

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

const buildPersonSamplePoints = (person: VisionPersonState) => {
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
  person: VisionPersonState,
  fovWorldRing: THREE.Vector3[],
) => {
  if (fovWorldRing.length < 3) {
    return false
  }

  const points = buildPersonSamplePoints(person)
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
  scene.people.forEach((person) => {
    const override = simulatedPeoplePositions.get(person.id)
    const base = override ?? transformer.toVector3([person.x, person.y], 0)
    peopleWorld[person.id] = {
      x: base.x,
      y: base.y,
      z: base.z,
      height: person.height,
      areaId: person.areaId,
    }
  })

  const visibleByCameraId: Record<string, string[]> = {}
  let detectionsCount = 0
  const areaById = new Map(scene.areas.map((area) => [area.id, area]))

  scene.cameras.forEach((camera) => {
    const direction = camera.ptz?.pan ?? camera.direction
    const area = areaById.get(camera.areaId)
    const obstacles = obstaclesByArea.get(camera.areaId) ?? []
    const fovRing = buildOccludedFovRing({
      origin: [camera.x, camera.y],
      direction,
      fov: getEffectiveHorizontalFov(camera),
      depth: camera.depth,
      cameraHeight: camera.height,
      area,
      obstacles,
    })
    const fovWorldRing = fovRing.map((point) => transformer.toVector3(point, 0))

    const visible: string[] = []
    Object.entries(peopleWorld).forEach(([personId, person]) => {
      if (isPersonInsideFovRing(person, fovWorldRing)) {
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
