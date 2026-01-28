import * as THREE from 'three'

import type {
  CameraEntity,
  SceneRoot,
  ShapeEntity,
} from '@/features/scene/domain/types'

import {DEFAULT_PERSON_RADIUS} from '@/features/scene/domain/constants/person-defaults'

import type {CoordinateTransformer} from './simulation-helpers'

import {getCameraOpticHeight} from './camera-collision-utils'

const DEFAULT_LINE_THICKNESS = 0.1
const EPSILON = 1e-5

interface ObstacleSegment {
  start: THREE.Vector2
  end: THREE.Vector2
  height: number
}

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

const degToRad = (deg: number) => (deg * Math.PI) / 180

const cross = (a: THREE.Vector2, b: THREE.Vector2) => a.x * b.y - a.y * b.x

const intersectSegments = (
  origin: THREE.Vector2,
  target: THREE.Vector2,
  a: THREE.Vector2,
  b: THREE.Vector2,
) => {
  const r = target.clone().sub(origin)
  const s = b.clone().sub(a)
  const denom = cross(r, s)
  if (Math.abs(denom) < EPSILON) {
    return null
  }
  const diff = a.clone().sub(origin)
  const t = cross(diff, s) / denom
  const u = cross(diff, r) / denom
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return t
  }
  return null
}

const buildPolygonSegments = (points: THREE.Vector2[], height: number) => {
  if (points.length < 2) {
    return []
  }
  const segments: ObstacleSegment[] = []
  for (let i = 0; i < points.length; i += 1) {
    const next = (i + 1) % points.length
    const start = points[i]
    const end = points[next]
    segments.push({start, end, height})
  }
  return segments
}

const buildWallSegments = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  thickness: number,
  height: number,
) => {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const length = Math.hypot(dx, dz)
  if (length < EPSILON) {
    return []
  }
  const ux = dx / length
  const uz = dz / length
  const px = -uz
  const pz = ux
  const half = thickness / 2
  const p1 = new THREE.Vector2(start.x + px * half, start.z + pz * half)
  const p2 = new THREE.Vector2(start.x - px * half, start.z - pz * half)
  const p3 = new THREE.Vector2(end.x - px * half, end.z - pz * half)
  const p4 = new THREE.Vector2(end.x + px * half, end.z + pz * half)
  return buildPolygonSegments([p1, p2, p3, p4], height)
}

const buildLineShapeSegments = (
  points: THREE.Vector3[],
  thickness: number,
  height: number,
) => {
  if (points.length < 2) {
    return []
  }
  const start = points[0]
  const end = points[points.length - 1]
  return buildWallSegments(start, end, thickness, height)
}

const buildShapeSegments = (shape: ShapeEntity, points: THREE.Vector3[]) => {
  const height = shape.height ?? 0
  if (shape.shapeType === 'line') {
    const thickness = shape.thickness ?? DEFAULT_LINE_THICKNESS
    return buildLineShapeSegments(points, thickness, height)
  }
  const ring: THREE.Vector2[] = points.map(
    (point) => new THREE.Vector2(point.x, point.z),
  )
  if (ring.length > 0) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first.distanceToSquared(last) > EPSILON) {
      ring.push(first)
    }
  }
  return buildPolygonSegments(ring, height)
}

export const buildObstacleSegmentsByArea = (
  scene: SceneRoot,
  transformer: CoordinateTransformer,
) => {
  const segmentsByArea = new Map<string, ObstacleSegment[]>()

  scene.areas.forEach((area) => {
    const points = area.geometry.coordinates.map((coord) =>
      transformer.toVector3(coord),
    )
    const ring = points.map((point) => new THREE.Vector2(point.x, point.z))
    if (ring.length > 0) {
      const first = ring[0]
      const last = ring[ring.length - 1]
      if (first.distanceToSquared(last) > EPSILON) {
        ring.push(first)
      }
    }
    const segments = buildPolygonSegments(ring, Number.MAX_SAFE_INTEGER)
    segmentsByArea.set(area.id, segments)
  })

  scene.walls.forEach((wall) => {
    const segments = segmentsByArea.get(wall.areaId) ?? []
    for (let index = 0; index < wall.points.length - 1; index += 1) {
      const start = transformer.toVector3(wall.points[index])
      const end = transformer.toVector3(wall.points[index + 1])
      segments.push(
        ...buildWallSegments(
          start,
          end,
          wall.thickness ?? DEFAULT_LINE_THICKNESS,
          wall.height ?? 0,
        ),
      )
    }
    segmentsByArea.set(wall.areaId, segments)
  })

  scene.shapes.forEach((shape) => {
    const segments = segmentsByArea.get(shape.areaId) ?? []
    const points = shape.geometry.map((coord) => transformer.toVector3(coord))
    segments.push(...buildShapeSegments(shape, points))
    segmentsByArea.set(shape.areaId, segments)
  })

  return segmentsByArea
}

const isPersonVisibleAtHeight = ({
  camera,
  cameraOrigin,
  forward,
  obstacles,
  person,
  targetHeight,
}: {
  camera: CameraEntity
  cameraOrigin: THREE.Vector3
  forward: THREE.Vector3
  obstacles: ObstacleSegment[]
  person: VisionPersonState
  targetHeight: number
}) => {
  const personTarget = new THREE.Vector3(
    person.x,
    person.y + targetHeight,
    person.z,
  )
  const toPerson = personTarget.clone().sub(cameraOrigin)
  const distance = toPerson.length()
  const near = Math.max(camera.nearClipping ?? 0.1, 0.1)
  const far = Math.max(camera.depth, near + 0.1)
  if (distance < near || distance > far) {
    return false
  }
  const fov = camera.fov / Math.max(camera.ptz?.zoom ?? 1, 0.0001)
  const halfFov = degToRad(fov) / 2
  const direction = toPerson.clone().normalize()
  if (direction.dot(forward) < Math.cos(halfFov)) {
    return false
  }
  const origin2d = new THREE.Vector2(cameraOrigin.x, cameraOrigin.z)
  const target2d = new THREE.Vector2(person.x, person.z)
  const targetDistance = origin2d.distanceTo(target2d)
  if (targetDistance < EPSILON) {
    return true
  }
  for (const obstacle of obstacles) {
    const t = intersectSegments(
      origin2d,
      target2d,
      obstacle.start,
      obstacle.end,
    )
    if (t === null || t <= EPSILON) {
      continue
    }
    if (obstacle.height === Number.MAX_SAFE_INTEGER) {
      const tolerance = Math.min(
        0.05,
        (DEFAULT_PERSON_RADIUS * 1.25) / Math.max(targetDistance, 0.01),
      )
      if (t >= 1 - tolerance) {
        continue
      }
    } else if (t >= 1 - EPSILON) {
      continue
    }
    const rayHeight =
      cameraOrigin.y + (personTarget.y - cameraOrigin.y) * t
    if (obstacle.height >= rayHeight) {
      return false
    }
  }
  return true
}

const isPersonVisible = ({
  camera,
  cameraOrigin,
  forward,
  peopleWorld,
  obstacles,
  personId,
}: {
  camera: CameraEntity
  cameraOrigin: THREE.Vector3
  forward: THREE.Vector3
  peopleWorld: Record<string, VisionPersonState>
  obstacles: ObstacleSegment[]
  personId: string
}) => {
  const person = peopleWorld[personId]
  if (!person) {
    return false
  }
  const baseHeight = Math.max(person.height, DEFAULT_PERSON_RADIUS * 2)
  const targetHeights = [baseHeight * 0.5, baseHeight]
  return targetHeights.some((targetHeight) =>
    isPersonVisibleAtHeight({
      camera,
      cameraOrigin,
      forward,
      obstacles,
      person,
      targetHeight,
    }),
  )
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
  obstaclesByArea: Map<string, ObstacleSegment[]>
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

  scene.cameras.forEach((camera) => {
    const cameraPosition = transformer.toVector3([camera.x, camera.y], 0)
    const opticHeight = getCameraOpticHeight(camera)
    const cameraOrigin = new THREE.Vector3(
      cameraPosition.x,
      opticHeight,
      cameraPosition.z,
    )
    const tilt = degToRad(camera.ptz?.tilt ?? 0)
    const yaw = -degToRad(camera.ptz?.pan ?? camera.direction)
    const forward = new THREE.Vector3(0, 0, -1)
      .applyEuler(new THREE.Euler(tilt, yaw, 0, 'YXZ'))
      .normalize()
    const obstacles = obstaclesByArea.get(camera.areaId) ?? []

    const visible: string[] = []
    Object.entries(peopleWorld).forEach(([personId, person]) => {
      if (person.areaId !== camera.areaId) {
        return
      }
      if (
        isPersonVisible({
          camera,
          cameraOrigin,
          forward,
          peopleWorld,
          obstacles,
          personId,
        })
      ) {
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
