import type {
  CameraEntity,
  CameraOptics,
  Resolution,
} from '@/features/scene/types/types'

const MIN_CAMERA_FOV_DEG = 1
const MAX_CAMERA_FOV_DEG = 179
const MIN_CAMERA_ZOOM = 0.0001

export const DEFAULT_CAMERA_RESOLUTION: Resolution = {
  width: 1920,
  height: 1080,
}

export const DEFAULT_CAMERA_HORIZONTAL_FOV = 90
export const DEFAULT_CAMERA_DEPTH = 20
export const DEFAULT_CAMERA_ZOOM = 1
export const DEFAULT_CAMERA_HEIGHT = 3

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const degToRad = (value: number) => (value * Math.PI) / 180
const radToDeg = (value: number) => (value * 180) / Math.PI

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const toPositiveOrFallback = (value: unknown, fallback: number) =>
  isPositiveNumber(value) ? value : fallback

const cameraHasLegacyFov = (
  camera: CameraEntity,
): camera is CameraEntity & {fov?: number} => 'fov' in camera

export const getCameraAspect = (
  source: Pick<CameraEntity, 'resolution'> | Resolution | undefined,
) => {
  const width = toPositiveOrFallback(
    source && 'resolution' in source ? source.resolution?.width : source?.width,
    DEFAULT_CAMERA_RESOLUTION.width,
  )
  const height = toPositiveOrFallback(
    source && 'resolution' in source
      ? source.resolution?.height
      : source?.height,
    DEFAULT_CAMERA_RESOLUTION.height,
  )

  return width / height
}

export const resolveVerticalFovFromHorizontal = (
  horizontalFov: number,
  aspect: number,
) => {
  const horizontal = clamp(
    horizontalFov,
    MIN_CAMERA_FOV_DEG,
    MAX_CAMERA_FOV_DEG,
  )
  const verticalRad =
    2 * Math.atan(Math.tan(degToRad(horizontal) / 2) / Math.max(aspect, 0.0001))
  return clamp(radToDeg(verticalRad), MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
}

export const resolveHorizontalFovFromVertical = (
  verticalFov: number,
  aspect: number,
) => {
  const vertical = clamp(verticalFov, MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
  const horizontalRad =
    2 * Math.atan(Math.tan(degToRad(vertical) / 2) * Math.max(aspect, 0.0001))
  return clamp(radToDeg(horizontalRad), MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
}

export const resolveBaseHorizontalFov = (camera: CameraEntity) => {
  if (isPositiveNumber(camera.fovHorizontal)) {
    return clamp(camera.fovHorizontal, MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
  }

  if (cameraHasLegacyFov(camera) && isPositiveNumber(camera.fov)) {
    return clamp(camera.fov, MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
  }

  if (isPositiveNumber(camera.fovVertical)) {
    return resolveHorizontalFovFromVertical(
      camera.fovVertical,
      getCameraAspect(camera),
    )
  }

  return DEFAULT_CAMERA_HORIZONTAL_FOV
}

export const resolveBaseVerticalFov = (camera: CameraEntity) => {
  if (isPositiveNumber(camera.fovVertical)) {
    return clamp(camera.fovVertical, MIN_CAMERA_FOV_DEG, MAX_CAMERA_FOV_DEG)
  }

  return resolveVerticalFovFromHorizontal(
    resolveBaseHorizontalFov(camera),
    getCameraAspect(camera),
  )
}

export const resolveCameraZoom = (camera: Pick<CameraEntity, 'zoom'>) =>
  toPositiveOrFallback(camera.zoom, DEFAULT_CAMERA_ZOOM)

export const getEffectiveHorizontalFov = (camera: CameraEntity) =>
  clamp(
    resolveBaseHorizontalFov(camera) /
      Math.max(resolveCameraZoom(camera), MIN_CAMERA_ZOOM),
    MIN_CAMERA_FOV_DEG,
    MAX_CAMERA_FOV_DEG,
  )

export const getEffectiveVerticalFov = (camera: CameraEntity) =>
  clamp(
    resolveBaseVerticalFov(camera) /
      Math.max(resolveCameraZoom(camera), MIN_CAMERA_ZOOM),
    MIN_CAMERA_FOV_DEG,
    MAX_CAMERA_FOV_DEG,
  )

export const createDefaultCameraOptics = (
  partial?: Partial<CameraOptics>,
): CameraOptics => {
  const resolution = {
    width: toPositiveOrFallback(
      partial?.resolution?.width,
      DEFAULT_CAMERA_RESOLUTION.width,
    ),
    height: toPositiveOrFallback(
      partial?.resolution?.height,
      DEFAULT_CAMERA_RESOLUTION.height,
    ),
  }
  const aspect = getCameraAspect(resolution)
  const fovHorizontal = toPositiveOrFallback(
    partial?.fovHorizontal,
    DEFAULT_CAMERA_HORIZONTAL_FOV,
  )
  const fallbackVertical = resolveVerticalFovFromHorizontal(
    fovHorizontal,
    aspect,
  )
  const fovVertical = toPositiveOrFallback(
    partial?.fovVertical,
    fallbackVertical,
  )

  return {
    fovHorizontal,
    fovVertical,
    depth: toPositiveOrFallback(partial?.depth, DEFAULT_CAMERA_DEPTH),
    zoom: toPositiveOrFallback(partial?.zoom, DEFAULT_CAMERA_ZOOM),
    height: toPositiveOrFallback(partial?.height, DEFAULT_CAMERA_HEIGHT),
    resolution,
  }
}
