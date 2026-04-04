import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
} from '@/features/scene/types/types'

import {getEffectiveHorizontalFov} from '@/features/scene/services/camera-optics'

import type {buildFovOcclusionObstacles} from '@/features/scene/map/map-view-helpers'

import {buildOccludedFovRing, projectPoint} from '@/features/scene/map/map-view-helpers'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const degToRad = (deg: number) => (deg * Math.PI) / 180

export const buildFovGroundRing = ({
  camera,
  origin,
  area,
  obstacles = [],
  segments = 20,
}: {
  camera: CameraEntity
  origin: GeoPoint
  area?: AreaEntity
  obstacles?: ReturnType<typeof buildFovOcclusionObstacles>
  segments?: number
}) => {
  const pan = camera.ptz.pan
  const fov = getEffectiveHorizontalFov(camera)
  const halfFov = fov / 2
  const start = pan - halfFov
  const step = fov / segments
  if (area || obstacles.length > 0) {
    return buildOccludedFovRing({
      origin,
      direction: pan,
      fov,
      depth: camera.depth,
      cameraHeight: camera.height,
      area,
      obstacles,
    })
  }
  const points: GeoPoint[] = []
  for (let i = 0; i <= segments; i += 1) {
    const bearing = start + step * i
    points.push(projectPoint(origin, bearing, camera.depth))
  }
  return points
}
