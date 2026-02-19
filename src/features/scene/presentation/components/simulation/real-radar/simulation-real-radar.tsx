/* eslint-disable complexity */

import 'mapbox-gl/dist/mapbox-gl.css'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {orderBy} from 'lodash-es'
import mapboxgl from 'mapbox-gl'
import React from 'react'

import type {
  CameraEntity,
  GeoPoint,
  SceneRoot,
} from '@/features/scene/domain/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {
  computeBounds,
  getBoundsCenter,
} from '@/features/scene/presentation/components/map-view/selection-geometry'

import type {
  CameraIntrinsics,
  CameraState,
  DetectionState,
  RadarMessage,
  RadarUpdateByTracker,
} from './real-radar-types'

import {RealDeviceFeedPlayer} from '../real-device-feed-player'
import {SimulationRealRadarActivities} from '../simulation-real-radar-activities'
import {useRealRadarIngestion} from './use-real-radar-ingestion'
import './simulation-real-radar.css'

interface SimulationRealRadarProps {
  scene: SceneRoot
  focusAreaId?: string
  size: {width: number; height: number}
  onSelectEntity: (id?: string) => void
}

const detectionTtlMs = 1_500
const radarUpdateTtlMs = 3_000
const fovSourceId = 'simulation-real-radar-fov'

const detectionIcons: Record<string, string> = {
  helmet: '🪖',
  cigarette: '🚬',
  hat: '🎩',
  facemask: '😷',
  firesmoke: '🔥',
  gloves: '🧤',
  vest: '🦺',
  boots: '🥾',
  goggles: '🥽',
  person: '🧍',
  bicycle: '🚲',
  motorcycle: '🏍️',
  car: '🚗',
  bus: '🚌',
  truck: '🚚',
  backpack: '🎒',
  cellphone: '📱',
}

const detectionColors: Record<string, string> = {
  helmet: '#f97316',
  cigarette: '#f43f5e',
  hat: '#a855f7',
  facemask: '#06b6d4',
  firesmoke: '#ef4444',
  gloves: '#22c55e',
  vest: '#facc15',
  boots: '#b45309',
  goggles: '#0ea5e9',
  person: '#38bdf8',
  bicycle: '#3b82f6',
  motorcycle: '#0f172a',
  car: '#14b8a6',
  bus: '#a855f7',
  truck: '#6366f1',
  backpack: '#ec4899',
  cellphone: '#64748b',
}

const defaultIntrinsics: CameraIntrinsics = {
  fx: 1_200,
  fy: 1_200,
  cx: 960,
  cy: 540,
  image_height: 1_080,
  image_width: 1_920,
}

const normalizeClassName = (value?: string) =>
  (value ?? 'unknown').toLowerCase()

const roundCoord = (value: number) => Number(value.toFixed(7))

const toFiniteNumber = (value: unknown, fallback: number) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const degToRad = (degrees: number) => (degrees * Math.PI) / 180

const resolvePositiveNumber = (value: unknown, fallback: number, min = 0) => {
  const resolved = toFiniteNumber(value, fallback)
  return resolved > min ? resolved : fallback
}

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

const cameraColorForId = (cameraId: string) => {
  let hash = 0

  for (let index = 0; index < cameraId.length; index += 1) {
    hash = (hash * 31 + cameraId.charCodeAt(index)) % 360
  }

  return `hsl(${Math.abs(hash)} 85% 55%)`
}

const getRadarTimestampValue = (value: number | string | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const formatRadarTimestamp = (value: number | string | undefined) => {
  const timestampValue = getRadarTimestampValue(value)
  if (typeof timestampValue !== 'number') {
    return '—'
  }

  return new Date(timestampValue).toLocaleTimeString()
}

const getScopedRealCameras = (scene: SceneRoot, focusAreaId?: string) =>
  scene.cameras.filter(
    (camera) =>
      camera.sourceDeviceKind === 'real' &&
      (!focusAreaId || camera.areaId === focusAreaId),
  )

const getDefaultCameraState = (): CameraState => ({
  camera_lat: 36.2605,
  camera_lon: 59.6168,
  camera_height_m: 8,
  yaw_deg: 45,
  pitch_deg: -10,
  roll_deg: 0,
  intrinsics: defaultIntrinsics,
})

const getMapModeAreaCenter = (
  scene: SceneRoot,
  focusAreaId?: string,
): GeoPoint | null => {
  const resolvedAreaId = focusAreaId ?? scene.activeAreaId
  const targetArea = resolvedAreaId
    ? scene.areas.find((area) => area.id === resolvedAreaId)
    : scene.areas[0]

  if (!targetArea) {
    return null
  }

  const bounds = computeBounds(targetArea.geometry.coordinates)
  if (!bounds) {
    return null
  }

  return getBoundsCenter(bounds)
}

const getCameraByIncomingId = (cameras: CameraEntity[]) => {
  return cameras.reduce<Record<string, CameraEntity>>((acc, camera) => {
    if (camera.id) {
      acc[camera.id] = camera
    }

    if (camera.sourceDeviceId) {
      acc[camera.sourceDeviceId] = camera
    }

    return acc
  }, {})
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

// eslint-disable-next-line max-lines-per-function, max-statements
export const SimulationRealRadar: React.FC<SimulationRealRadarProps> = ({
  scene,
  focusAreaId,
  size,
  onSelectEntity,
}) => {
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const scopedRealCameras = React.useMemo(
    () => getScopedRealCameras(scene, focusAreaId),
    [focusAreaId, scene],
  )
  const cameraByIncomingId = React.useMemo(
    () => getCameraByIncomingId(scopedRealCameras),
    [scopedRealCameras],
  )
  const scopedDeviceIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          scopedRealCameras
            .map((camera) => camera.sourceDeviceId)
            .filter((deviceId) => typeof deviceId === 'string' && deviceId),
        ),
      ),
    [scopedRealCameras],
  )
  const scopedDeviceIdsKey = React.useMemo(
    () => scopedDeviceIds.join('|'),
    [scopedDeviceIds],
  )

  const defaultCameraState = React.useMemo(() => getDefaultCameraState(), [])
  const mapCenter = React.useMemo<GeoPoint>(() => {
    if (scene.editorMode !== 'map') {
      return [defaultCameraState.camera_lon, defaultCameraState.camera_lat]
    }

    return (
      getMapModeAreaCenter(scene, focusAreaId) ?? [
        defaultCameraState.camera_lon,
        defaultCameraState.camera_lat,
      ]
    )
  }, [
    defaultCameraState.camera_lat,
    defaultCameraState.camera_lon,
    focusAreaId,
    scene,
  ])

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const detectionOverlayRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const mapLoadedRef = React.useRef(false)
  const hasAutoFocusedRef = React.useRef(false)

  const cameraByIncomingIdRef = React.useRef(cameraByIncomingId)
  const defaultCameraStateRef = React.useRef(defaultCameraState)

  const cameraStatesRef = React.useRef(new Map<string, CameraState>())
  const cameraMarkersRef = React.useRef(new Map<string, mapboxgl.Marker>())
  const detectionStatesRef = React.useRef(new Map<string, DetectionState>())
  const detectionMarkersRef = React.useRef(new Map<string, HTMLDivElement>())

  const detectionExpiryTimersRef = React.useRef(new Map<string, number>())
  const radarUpdateTimersRef = React.useRef(new Map<string, number>())

  const [radarUpdatesByTracker, setRadarUpdatesByTracker] =
    React.useState<RadarUpdateByTracker>({})
  const [selectedCamera, setSelectedCamera] =
    React.useState<CameraEntity | null>(null)

  const radarUpdateItems = React.useMemo(
    () =>
      orderBy(
        Object.values(radarUpdatesByTracker),
        [(item) => item.timestampValue ?? 0, (item) => item.trackerId],
        ['desc', 'asc'],
      ),
    [radarUpdatesByTracker],
  )

  const mapHeight = React.useMemo(
    () => Math.max(260, Math.round(size.height * 1.8)),
    [size.height],
  )

  const renderAllDetections = useCallbackRef(() => {
    const map = mapRef.current
    const overlay = detectionOverlayRef.current

    if (!map || !overlay) {
      return
    }

    detectionStatesRef.current.forEach((detectionState, detectionId) => {
      const point = map.project([detectionState.lon, detectionState.lat])
      const existing = detectionMarkersRef.current.get(detectionId)

      if (!existing) {
        return
      }

      existing.style.left = `${point.x}px`
      existing.style.top = `${point.y}px`
    })
  })

  const updateCameraDirection = useCallbackRef(
    (marker: mapboxgl.Marker, yawDeg: number) => {
      const directionElement = marker
        .getElement()
        .querySelector('.real-radar-camera-direction') as HTMLDivElement | null

      if (directionElement) {
        directionElement.style.transform = `translate(-50%, -90%) rotate(${yawDeg}deg)`
      }
    },
  )

  const openCameraVideo = useCallbackRef((cameraId: string) => {
    const camera = cameraByIncomingIdRef.current[cameraId]

    if (!camera) {
      return
    }

    onSelectEntity(camera.id)
    setSelectedCamera(camera)
  })

  const updateCameraMarkerInteractivity = useCallbackRef(
    (element: HTMLDivElement, cameraId: string) => {
      const camera = cameraByIncomingIdRef.current[cameraId]
      const hasVideo = Boolean(camera)

      element.classList.toggle('clickable', hasVideo)

      if (!hasVideo) {
        element.removeAttribute('role')
        element.removeAttribute('aria-label')
        element.onclick = null
        return
      }

      element.setAttribute('role', 'button')
      element.setAttribute(
        'aria-label',
        `Open ${camera.sourceDeviceName || camera.name} stream`,
      )
      element.onclick = (event) => {
        event.stopPropagation()
        openCameraVideo(cameraId)
      }
    },
  )

  const createCameraMarkerElement = useCallbackRef((cameraId: string) => {
    const container = document.createElement('div')
    container.className = 'real-radar-camera-marker'
    container.style.setProperty('--camera-color', cameraColorForId(cameraId))

    updateCameraMarkerInteractivity(container, cameraId)

    const label = document.createElement('div')
    label.className = 'real-radar-camera-label'
    label.textContent =
      cameraByIncomingIdRef.current[cameraId]?.sourceDeviceName ?? cameraId

    const body = document.createElement('div')
    body.className = 'real-radar-camera-body'

    const direction = document.createElement('div')
    direction.className = 'real-radar-camera-direction'

    container.appendChild(label)
    container.appendChild(body)
    container.appendChild(direction)

    return container
  })

  const updateCameraFovs = useCallbackRef(() => {
    const map = mapRef.current

    if (!map || !mapLoadedRef.current) {
      return
    }

    const source = map.getSource(fovSourceId) as
      | mapboxgl.GeoJSONSource
      | undefined
    if (!source) {
      return
    }

    const features = Array.from(cameraStatesRef.current.entries()).map(
      ([cameraId, cameraState]) => {
        const intrinsics = cameraState.intrinsics
        const safeWidth = Math.max(
          1,
          toFiniteNumber(intrinsics.image_width, defaultIntrinsics.image_width),
        )
        const safeHeight = Math.max(
          1,
          toFiniteNumber(
            intrinsics.image_height,
            defaultIntrinsics.image_height,
          ),
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
      },
    )

    source.setData({
      type: 'FeatureCollection',
      features,
    })
  })

  const ensureCameraMarker = useCallbackRef(
    (cameraId: string, cameraState: CameraState) => {
      const map = mapRef.current

      if (!map) {
        return
      }

      const existingMarker = cameraMarkersRef.current.get(cameraId)
      if (existingMarker) {
        existingMarker.setLngLat([
          cameraState.camera_lon,
          cameraState.camera_lat,
        ])
        updateCameraDirection(existingMarker, cameraState.yaw_deg)
        updateCameraMarkerInteractivity(
          existingMarker.getElement() as HTMLDivElement,
          cameraId,
        )

        const label = existingMarker
          .getElement()
          .querySelector('.real-radar-camera-label') as HTMLDivElement | null

        if (label) {
          label.textContent =
            cameraByIncomingIdRef.current[cameraId]?.sourceDeviceName ??
            cameraId
        }

        return
      }

      const markerElement = createCameraMarkerElement(cameraId)
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'bottom',
      })
        .setLngLat([cameraState.camera_lon, cameraState.camera_lat])
        .addTo(map)

      cameraMarkersRef.current.set(cameraId, marker)
      updateCameraDirection(marker, cameraState.yaw_deg)
    },
  )

  const upsertCamera = useCallbackRef(
    (cameraId: string, cameraState: CameraState) => {
      cameraStatesRef.current.set(cameraId, cameraState)
      ensureCameraMarker(cameraId, cameraState)
      updateCameraFovs()
    },
  )

  const updateDetectionElement = useCallbackRef(
    (element: HTMLDivElement, detectionState: DetectionState) => {
      const icon = detectionIcons[detectionState.className] ?? '📍'
      const color = detectionColors[detectionState.className] ?? '#f97316'

      element.style.setProperty('--marker-color', color)
      element.title = `${detectionState.className} (${Math.round((detectionState.confidence ?? 0) * 100)}%)`

      let iconElement = element.querySelector(
        '.real-radar-detection-icon',
      ) as HTMLDivElement | null

      if (!iconElement) {
        iconElement = document.createElement('div')
        iconElement.className = 'real-radar-detection-icon'
        element.appendChild(iconElement)
      }

      iconElement.textContent = icon
    },
  )

  const ensureDetectionMarker = useCallbackRef(
    (detectionId: string, detectionState: DetectionState) => {
      const map = mapRef.current
      const overlay = detectionOverlayRef.current

      if (!map || !overlay) {
        return
      }

      const point = map.project([detectionState.lon, detectionState.lat])
      const existingElement = detectionMarkersRef.current.get(detectionId)

      if (existingElement) {
        existingElement.style.left = `${point.x}px`
        existingElement.style.top = `${point.y}px`
        updateDetectionElement(existingElement, detectionState)
        return
      }

      const element = document.createElement('div')
      element.className = 'real-radar-detection-marker'
      element.style.left = `${point.x}px`
      element.style.top = `${point.y}px`

      updateDetectionElement(element, detectionState)

      overlay.appendChild(element)
      detectionMarkersRef.current.set(detectionId, element)
    },
  )

  const removeDetection = useCallbackRef((detectionId: string) => {
    detectionStatesRef.current.delete(detectionId)

    const marker = detectionMarkersRef.current.get(detectionId)
    if (marker) {
      marker.remove()
      detectionMarkersRef.current.delete(detectionId)
    }

    const timerId = detectionExpiryTimersRef.current.get(detectionId)
    if (timerId) {
      window.clearTimeout(timerId)
      detectionExpiryTimersRef.current.delete(detectionId)
    }
  })

  const scheduleDetectionExpiry = useCallbackRef((detectionId: string) => {
    const existingTimer = detectionExpiryTimersRef.current.get(detectionId)

    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }

    const timerId = window.setTimeout(() => {
      removeDetection(detectionId)
    }, detectionTtlMs)

    detectionExpiryTimersRef.current.set(detectionId, timerId)
  })

  const upsertDetection = useCallbackRef(
    (detectionId: string, detectionState: DetectionState) => {
      detectionStatesRef.current.set(detectionId, detectionState)
      ensureDetectionMarker(detectionId, detectionState)
      scheduleDetectionExpiry(detectionId)
    },
  )

  const focusOnCamera = useCallbackRef((cameraState: CameraState) => {
    const map = mapRef.current

    if (!map) {
      return
    }

    map.easeTo({
      center: [cameraState.camera_lon, cameraState.camera_lat],
      zoom: 16,
      duration: 800,
    })
  })

  const handleRadarMessage = useCallbackRef(
    (message: RadarMessage, fallbackCameraId?: string) => {
      if (!message.detection || message.detection.trackerId == null) {
        return
      }

      const normalizedFallbackCameraId = fallbackCameraId?.trim()
      const cameraId =
        typeof message.camera?.id === 'string' &&
        message.camera.id.trim().length > 0
          ? message.camera.id.trim()
          : normalizedFallbackCameraId && normalizedFallbackCameraId.length > 0
            ? normalizedFallbackCameraId
            : null

      if (!cameraId) {
        return
      }

      const sourceCamera = message.source_camera ?? {}
      const incomingCamera = message.camera ?? {}
      const baseCameraState =
        cameraStatesRef.current.get(cameraId) ?? defaultCameraStateRef.current

      const cameraState: CameraState = {
        camera_lat: roundCoord(
          toFiniteNumber(
            sourceCamera.camera_lat ?? incomingCamera.lat,
            baseCameraState.camera_lat,
          ),
        ),
        camera_lon: roundCoord(
          toFiniteNumber(
            sourceCamera.camera_lon ?? incomingCamera.lon,
            baseCameraState.camera_lon,
          ),
        ),
        camera_height_m: resolvePositiveNumber(
          sourceCamera.camera_height_m ?? incomingCamera.height_m,
          baseCameraState.camera_height_m,
        ),
        yaw_deg: toFiniteNumber(
          sourceCamera.yaw_deg ?? incomingCamera.yaw_deg,
          baseCameraState.yaw_deg,
        ),
        pitch_deg: toFiniteNumber(
          sourceCamera.pitch_deg ?? incomingCamera.pitch_deg,
          baseCameraState.pitch_deg,
        ),
        roll_deg: toFiniteNumber(
          sourceCamera.roll_deg ?? incomingCamera.roll_deg,
          baseCameraState.roll_deg,
        ),
        intrinsics: {
          ...defaultIntrinsics,
          ...baseCameraState.intrinsics,
          ...(sourceCamera.intrinsics ?? {}),
        },
      }

      upsertCamera(cameraId, cameraState)

      if (!hasAutoFocusedRef.current && mapLoadedRef.current) {
        focusOnCamera(cameraState)
        hasAutoFocusedRef.current = true
      }

      const className = normalizeClassName(message.detection.class)
      const trackerId = String(message.detection.trackerId)
      const detectionKey = `${cameraId}-${trackerId}`

      const detectionState: DetectionState = {
        id: detectionKey,
        trackerId,
        cameraId,
        lat: toFiniteNumber(message.geo?.object_lat, cameraState.camera_lat),
        lon: toFiniteNumber(message.geo?.object_lon, cameraState.camera_lon),
        className,
        confidence: message.detection.confidence,
        ts: message.ts,
      }

      upsertDetection(detectionKey, detectionState)
    },
  )

  const scheduleRadarUpdateExpiry = useCallbackRef((trackerId: string) => {
    const existingTimer = radarUpdateTimersRef.current.get(trackerId)

    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }

    const timerId = window.setTimeout(() => {
      setRadarUpdatesByTracker((previous) => {
        if (!previous[trackerId]) {
          return previous
        }

        const {[trackerId]: removedTracker, ...next} = previous
        void removedTracker
        return next
      })

      radarUpdateTimersRef.current.delete(trackerId)
    }, radarUpdateTtlMs)

    radarUpdateTimersRef.current.set(trackerId, timerId)
  })

  const handleRadarMessages = useCallbackRef((messages: RadarMessage[]) => {
    const nextUpdatesByTracker: RadarUpdateByTracker = {}

    messages.forEach((message) => {
      if (!message.detection || message.detection.trackerId == null) {
        return
      }

      const cameraId =
        typeof message.camera?.id === 'string' && message.camera.id
          ? message.camera.id
          : null

      if (!cameraId) {
        return
      }

      const trackerId = String(message.detection.trackerId)
      const className = normalizeClassName(message.detection.class)
      const sourceCamera = message.source_camera ?? {}
      const incomingCamera = message.camera ?? {}
      const defaultState = defaultCameraStateRef.current
      const fallbackLat = toFiniteNumber(
        sourceCamera.camera_lat ?? incomingCamera.lat,
        defaultState.camera_lat,
      )
      const fallbackLon = toFiniteNumber(
        sourceCamera.camera_lon ?? incomingCamera.lon,
        defaultState.camera_lon,
      )
      const timestampSource = message.ts ?? message.timestamp

      nextUpdatesByTracker[trackerId] = {
        id: trackerId,
        trackerId,
        cameraId,
        className,
        confidence: message.detection.confidence,
        lat: toFiniteNumber(message.geo?.object_lat, fallbackLat),
        lon: toFiniteNumber(message.geo?.object_lon, fallbackLon),
        distance: message.geo?.distance_m,
        timestampLabel: formatRadarTimestamp(timestampSource),
        timestampValue: getRadarTimestampValue(timestampSource),
      }

      handleRadarMessage(message, cameraId)
    })

    if (!Object.keys(nextUpdatesByTracker).length) {
      return
    }

    Object.keys(nextUpdatesByTracker).forEach((trackerId) => {
      scheduleRadarUpdateExpiry(trackerId)
    })

    setRadarUpdatesByTracker((previous) => {
      const next = {...previous}

      Object.entries(nextUpdatesByTracker).forEach(([trackerId, update]) => {
        const existing = previous[trackerId]

        if (!existing) {
          next[trackerId] = update
          return
        }

        const existingValue = existing.timestampValue ?? 0
        const updateValue = update.timestampValue ?? 0

        if (updateValue >= existingValue) {
          next[trackerId] = update
        }
      })

      return next
    })
  })

  useRealRadarIngestion({
    deviceIds: scopedDeviceIds,
    onMessages: handleRadarMessages,
  })

  React.useEffect(() => {
    cameraByIncomingIdRef.current = cameraByIncomingId
    defaultCameraStateRef.current = defaultCameraState

    cameraMarkersRef.current.forEach((marker, cameraId) => {
      updateCameraMarkerInteractivity(
        marker.getElement() as HTMLDivElement,
        cameraId,
      )
      const label = marker
        .getElement()
        .querySelector('.real-radar-camera-label') as HTMLDivElement | null

      if (label) {
        label.textContent =
          cameraByIncomingId[cameraId]?.sourceDeviceName ?? cameraId
      }
    })
  }, [cameraByIncomingId, defaultCameraState, updateCameraMarkerInteractivity])

  React.useEffect(() => {
    cameraStatesRef.current.clear()
    cameraMarkersRef.current.forEach((marker) => {
      marker.remove()
    })
    cameraMarkersRef.current.clear()

    detectionStatesRef.current.clear()
    detectionMarkersRef.current.forEach((marker) => {
      marker.remove()
    })
    detectionMarkersRef.current.clear()

    detectionExpiryTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    detectionExpiryTimersRef.current.clear()

    radarUpdateTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    radarUpdateTimersRef.current.clear()

    setRadarUpdatesByTracker({})
    hasAutoFocusedRef.current = false

    updateCameraFovs()
  }, [scopedDeviceIdsKey, updateCameraFovs])

  React.useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = mapboxToken
    mapContainerRef.current.innerHTML = ''

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: 15,
      pitch: 45,
      bearing: 0,
      antialias: true,
    })

    mapRef.current = map

    const handleMove = () => {
      renderAllDetections()
    }

    map.on('move', handleMove)
    map.on('zoom', handleMove)
    map.on('pitch', handleMove)
    map.on('rotate', handleMove)

    map.addControl(
      new mapboxgl.NavigationControl({visualizePitch: true}),
      'top-right',
    )

    map.on('load', () => {
      mapLoadedRef.current = true

      map.addSource(fovSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      map.addLayer({
        id: `${fovSourceId}-fill`,
        type: 'fill',
        source: fovSourceId,
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#22d3ee'],
          'fill-opacity': 0.18,
        },
      })

      map.addLayer({
        id: `${fovSourceId}-outline`,
        type: 'line',
        source: fovSourceId,
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#22d3ee'],
          'line-width': 2,
          'line-dasharray': [1.5, 1],
        },
      })

      updateCameraFovs()
    })

    const detectionExpiryTimers = detectionExpiryTimersRef.current
    const radarUpdateTimers = radarUpdateTimersRef.current
    const cameraMarkers = cameraMarkersRef.current
    const detectionMarkers = detectionMarkersRef.current
    const cameraStates = cameraStatesRef.current
    const detectionStates = detectionStatesRef.current

    return () => {
      map.off('move', handleMove)
      map.off('zoom', handleMove)
      map.off('pitch', handleMove)
      map.off('rotate', handleMove)

      detectionExpiryTimers.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      detectionExpiryTimers.clear()

      radarUpdateTimers.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      radarUpdateTimers.clear()

      cameraMarkers.forEach((marker) => {
        marker.remove()
      })
      cameraMarkers.clear()

      detectionMarkers.forEach((marker) => {
        marker.remove()
      })
      detectionMarkers.clear()

      cameraStates.clear()
      detectionStates.clear()

      mapLoadedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [mapCenter, mapboxToken, renderAllDetections, updateCameraFovs])

  React.useEffect(() => {
    if (scene.editorMode !== 'map') {
      return
    }

    const map = mapRef.current
    if (!map || !mapLoadedRef.current) {
      return
    }

    map.easeTo({
      center: mapCenter,
      duration: 600,
    })
  }, [mapCenter, scene.editorMode])

  React.useEffect(
    () => () => {
      radarUpdateTimersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      radarUpdateTimersRef.current.clear()
    },
    [],
  )

  return (
    <>
      <div className='vs:flex vs:min-h-0 vs:flex-1 vs:flex-col vs:gap-2 vs:p-3'>
        <div
          className='real-radar-map-frame'
          style={{height: `${mapHeight}px`}}
        >
          {mapboxToken ? (
            <div className='real-radar-map-container' ref={mapContainerRef} />
          ) : (
            <div className='real-radar-map-placeholder'>
              <p>
                Add your Mapbox token via `mapboxToken` prop or
                `VITE_MAPBOX_TOKEN`.
              </p>
            </div>
          )}

          <div
            className='real-radar-detection-overlay'
            ref={detectionOverlayRef}
          />

          <div className='real-radar-map-hint'>
            Area devices: {scopedDeviceIds.length} | Live trackers:{' '}
            {radarUpdateItems.length}
          </div>
        </div>

        <div aria-hidden='true' className='vs:hidden'>
          <SimulationRealRadarActivities activities={radarUpdateItems} />
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCamera(null)
          }
        }}
        open={Boolean(selectedCamera)}
      >
        <DialogContent className='vs:max-h-[85dvh] vs:overflow-hidden vs:p-0 vs:sm:max-w-[900px]'>
          <DialogHeader className='vs:px-4 vs:pt-4'>
            <DialogTitle>
              {selectedCamera?.sourceDeviceName ??
                selectedCamera?.name ??
                'Camera stream'}
            </DialogTitle>
          </DialogHeader>
          <div className='vs:h-[540px]'>
            {selectedCamera ? (
              <RealDeviceFeedPlayer
                camera={selectedCamera}
                allowFullscreen={false}
                autoPlay
                showControls
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
