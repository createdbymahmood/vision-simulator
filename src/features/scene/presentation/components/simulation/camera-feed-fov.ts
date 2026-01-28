import type {CameraEntity} from '@/features/scene/domain/types'

const MAX_FEED_HORIZONTAL_FOV_DEG = 160
const MAX_FEED_VERTICAL_FOV_DEG = 120
const MIN_FEED_FOV_DEG = 5

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const degToRad = (deg: number) => (deg * Math.PI) / 180
const radToDeg = (rad: number) => (rad * 180) / Math.PI

const getCameraAspect = (camera: CameraEntity) => {
  const width = Math.max(camera.resolution?.width ?? 16, 1)
  const height = Math.max(camera.resolution?.height ?? 9, 1)
  return width / height
}

export const getFeedVerticalFov = (camera: CameraEntity) => {
  const zoom = Math.max(camera.ptz?.zoom ?? 1, 0.0001)
  const horizontal = clamp(
    camera.fov / zoom,
    MIN_FEED_FOV_DEG,
    MAX_FEED_HORIZONTAL_FOV_DEG,
  )
  const aspect = getCameraAspect(camera)
  const verticalRad = 2 * Math.atan(Math.tan(degToRad(horizontal) / 2) / aspect)
  return clamp(
    radToDeg(verticalRad),
    MIN_FEED_FOV_DEG,
    MAX_FEED_VERTICAL_FOV_DEG,
  )
}
