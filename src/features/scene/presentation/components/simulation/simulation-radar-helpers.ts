import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
} from '@/features/scene/domain/types'

import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'

import type {buildFovOcclusionObstacles} from '../map-view/map-view-helpers'

import {buildOccludedFovRing, projectPoint} from '../map-view/map-view-helpers'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const degToRad = (deg: number) => (deg * Math.PI) / 180

export const buildFovGroundRing = ({
  camera,
  origin,
  opticHeight,
  area,
  obstacles = [],
  segments = 20,
}: {
  camera: CameraEntity
  origin: GeoPoint
  opticHeight: number
  area?: AreaEntity
  obstacles?: ReturnType<typeof buildFovOcclusionObstacles>
  segments?: number
}) => {
  const pan = camera.ptz.pan
  const fov = getEffectiveHorizontalFov(camera)
  const halfFov = fov / 2
  const start = pan - halfFov
  const step = fov / segments
  const tilt = degToRad(camera.ptz?.tilt ?? 0)
  const sinTilt = Math.sin(tilt)
  let distance = camera.depth
  if (sinTilt < -1e-4) {
    distance = Math.min(distance, opticHeight / -sinTilt)
  }
  if (area || obstacles.length > 0) {
    return buildOccludedFovRing({
      origin,
      direction: pan,
      fov,
      depth: distance,
      cameraHeight: camera.height,
      area,
      obstacles,
    })
  }
  const points: GeoPoint[] = []
  for (let i = 0; i <= segments; i += 1) {
    const bearing = start + step * i
    points.push(projectPoint(origin, bearing, distance))
  }
  return points
}
