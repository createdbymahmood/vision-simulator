import type {CameraIntrinsics, CameraState} from './real-radar-types'

const toFiniteNumber = (value: unknown, fallback: number) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const degToRad = (degrees: number) => (degrees * Math.PI) / 180

const resolveHalfFovRadians = ({
  fallbackFovDeg,
  fovDeg,
  focalLength,
  size,
}: {
  fovDeg?: number
  focalLength: number
  size: number
  fallbackFovDeg: number
}) => {
  const resolvedFovDeg =
    typeof fovDeg === 'number' && Number.isFinite(fovDeg) && fovDeg > 0
      ? fovDeg
      : fallbackFovDeg
  const boundedFovDeg = Math.min(170, Math.max(2, resolvedFovDeg))
  const halfByFovRad = degToRad(boundedFovDeg / 2)
  const halfByFocalRad = Math.atan(size / (2 * focalLength))

  return Math.min(
    degToRad(85),
    Math.max(degToRad(1), halfByFovRad || halfByFocalRad),
  )
}

const resolveFocalLength = ({
  fallbackFocal,
  fovDeg,
  providedFocal,
  size,
}: {
  providedFocal?: number
  size: number
  fovDeg?: number
  fallbackFocal: number
}) => {
  if (
    typeof providedFocal === 'number' &&
    Number.isFinite(providedFocal) &&
    providedFocal > 0
  ) {
    return providedFocal
  }

  if (typeof fovDeg === 'number' && Number.isFinite(fovDeg) && fovDeg > 0) {
    const boundedFov = Math.min(170, Math.max(2, fovDeg))
    return size / (2 * Math.tan(degToRad(boundedFov / 2)))
  }

  return fallbackFocal
}

export const cameraColorForId = (cameraId: string) => {
  let hash = 0

  for (let index = 0; index < cameraId.length; index += 1) {
    hash = (hash * 31 + cameraId.charCodeAt(index)) % 360
  }

  return `hsl(${Math.abs(hash)} 85% 55%)`
}

const offsetMeters = (
  lat: number,
  lon: number,
  deltaXMeters: number,
  deltaYMeters: number,
) => {
  const earthRadius = 6_378_137
  const dLat = deltaYMeters / earthRadius
  const dLon = deltaXMeters / (earthRadius * Math.cos(degToRad(lat)))

  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lon + (dLon * 180) / Math.PI,
  }
}

export const buildCameraFovFeatures = ({
  cameraStates,
  defaultIntrinsics,
}: {
  cameraStates: [string, CameraState][]
  defaultIntrinsics: CameraIntrinsics
}) =>
  cameraStates.map(([cameraId, cameraState]) => {
    const intrinsics = cameraState.intrinsics
    const safeWidth = Math.max(
      1,
      toFiniteNumber(intrinsics.image_width, defaultIntrinsics.image_width),
    )
    const safeHeight = Math.max(
      1,
      toFiniteNumber(intrinsics.image_height, defaultIntrinsics.image_height),
    )
    const safeFx = resolveFocalLength({
      providedFocal: intrinsics.fx,
      fovDeg: intrinsics.hfov_deg,
      size: safeWidth,
      fallbackFocal: 1_200,
    })
    const safeFy = resolveFocalLength({
      providedFocal: intrinsics.fy,
      fovDeg: intrinsics.vfov_deg,
      size: safeHeight,
      fallbackFocal: 1_200,
    })
    const safeCx = toFiniteNumber(intrinsics.cx, safeWidth / 2)
    const safeCy = toFiniteNumber(intrinsics.cy, safeHeight / 2)
    const halfHfovRad = resolveHalfFovRadians({
      fovDeg: intrinsics.hfov_deg,
      focalLength: safeFx,
      size: safeWidth,
      fallbackFovDeg: defaultIntrinsics.hfov_deg ?? 90,
    })
    const halfVfovRad = resolveHalfFovRadians({
      fovDeg: intrinsics.vfov_deg,
      focalLength: safeFy,
      size: safeHeight,
      fallbackFovDeg: defaultIntrinsics.vfov_deg ?? 60,
    })
    const yawOffsetRad = Math.atan((safeCx - safeWidth / 2) / safeFx)
    const pitchOffsetRad = Math.atan((safeCy - safeHeight / 2) / safeFy)
    const centerBearingRad = degToRad(cameraState.yaw_deg) + yawOffsetRad
    const pitchCenterRad = degToRad(cameraState.pitch_deg) - pitchOffsetRad
    const downwardCenterRad = Math.max(0.05, -pitchCenterRad)
    const topAngle = Math.max(0.02, downwardCenterRad - halfVfovRad)
    const bottomAngle = Math.max(0.02, downwardCenterRad + halfVfovRad)

    const maxDistance = 500
    const minDistance = 20
    const clampDistance = (value: number) =>
      Math.min(maxDistance, Math.max(minDistance, value))

    const farDistance = clampDistance(
      cameraState.camera_height_m / Math.tan(topAngle),
    )
    let nearDistance = clampDistance(
      cameraState.camera_height_m / Math.tan(bottomAngle),
    )

    if (nearDistance >= farDistance) {
      nearDistance = Math.max(minDistance, farDistance * 0.6)
    }

    const rangeLeft = centerBearingRad - halfHfovRad
    const rangeRight = centerBearingRad + halfHfovRad

    const toOffset = (bearingRad: number, distanceMeters: number) => {
      const dx = Math.sin(bearingRad) * distanceMeters
      const dy = Math.cos(bearingRad) * distanceMeters

      return offsetMeters(
        cameraState.camera_lat,
        cameraState.camera_lon,
        dx,
        dy,
      )
    }

    const nearLeft = toOffset(rangeLeft, nearDistance)
    const nearRight = toOffset(rangeRight, nearDistance)
    const farLeft = toOffset(rangeLeft, farDistance)
    const farRight = toOffset(rangeRight, farDistance)

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [nearLeft.lng, nearLeft.lat],
            [farLeft.lng, farLeft.lat],
            [farRight.lng, farRight.lat],
            [nearRight.lng, nearRight.lat],
            [nearLeft.lng, nearLeft.lat],
          ],
        ],
      },
      properties: {
        id: cameraId,
        color: cameraColorForId(cameraId),
      },
    }
  })
