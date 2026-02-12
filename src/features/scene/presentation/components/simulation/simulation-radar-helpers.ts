import type {CameraEntity, GeoPoint} from '@/features/scene/domain/types'

import {getEffectiveHorizontalFov} from '@/features/scene/domain/services/camera-optics'

import {projectPoint} from '../map-view/map-view-helpers'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const degToRad = (deg: number) => (deg * Math.PI) / 180

export const buildFovGroundRing = ({
  camera,
  origin,
  opticHeight,
  segments = 20,
}: {
  camera: CameraEntity
  origin: GeoPoint
  opticHeight: number
  segments?: number
}) => {
  const pan = camera.ptz?.pan ?? camera.direction
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
  const points: GeoPoint[] = []
  for (let i = 0; i <= segments; i += 1) {
    const bearing = start + step * i
    points.push(projectPoint(origin, bearing, distance))
  }
  return points
}
