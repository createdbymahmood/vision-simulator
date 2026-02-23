/* eslint-disable complexity */

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {orderBy} from 'lodash-es'
import React from 'react'

import type {
  CameraIntrinsics,
  CameraState,
  DetectionState,
  RadarMessage,
  RadarUpdateByTracker,
} from './real-radar-types'

import {useRealRadarIngestion} from './use-real-radar-ingestion'

const detectionTtlMs = 1_500
const radarUpdateTtlMs = 3_000

const normalizeClassName = (value?: string) =>
  (value ?? 'unknown').toLowerCase()

const roundCoord = (value: number) => Number(value.toFixed(7))

const toFiniteNumber = (value: unknown, fallback: number) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const resolvePositiveNumber = (value: unknown, fallback: number, min = 0) => {
  const resolved = toFiniteNumber(value, fallback)
  return resolved > min ? resolved : fallback
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

interface UseRealRadarRuntimeInput {
  cameraStatesRef: React.MutableRefObject<Map<string, CameraState>>
  detectionStatesRef: React.MutableRefObject<Map<string, DetectionState>>
  defaultCameraStateRef: React.MutableRefObject<CameraState>
  defaultIntrinsics: CameraIntrinsics
  deviceIds: string[]
  onCameraUpsert: (cameraId: string, cameraState: CameraState) => void
  onDetectionUpsert: (
    detectionId: string,
    detectionState: DetectionState,
  ) => void
  onDetectionRemove: (detectionId: string) => void
}

// eslint-disable-next-line max-lines-per-function
export const useRealRadarRuntime = ({
  cameraStatesRef,
  detectionStatesRef,
  defaultCameraStateRef,
  defaultIntrinsics,
  deviceIds,
  onCameraUpsert,
  onDetectionUpsert,
  onDetectionRemove,
}: UseRealRadarRuntimeInput) => {
  const [radarUpdatesByTracker, setRadarUpdatesByTracker] =
    React.useState<RadarUpdateByTracker>({})

  const onCameraUpsertRef = useCallbackRef(onCameraUpsert)
  const onDetectionUpsertRef = useCallbackRef(onDetectionUpsert)
  const onDetectionRemoveRef = useCallbackRef(onDetectionRemove)

  const detectionExpiryTimersRef = React.useRef(new Map<string, number>())
  const radarUpdateTimersRef = React.useRef(new Map<string, number>())

  const removeDetection = useCallbackRef((detectionId: string) => {
    detectionStatesRef.current.delete(detectionId)

    const timerId = detectionExpiryTimersRef.current.get(detectionId)
    if (timerId) {
      window.clearTimeout(timerId)
      detectionExpiryTimersRef.current.delete(detectionId)
    }

    onDetectionRemoveRef(detectionId)
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

  const upsertCamera = useCallbackRef(
    (cameraId: string, cameraState: CameraState) => {
      cameraStatesRef.current.set(cameraId, cameraState)
      onCameraUpsertRef(cameraId, cameraState)
    },
  )

  const upsertDetection = useCallbackRef(
    (detectionId: string, detectionState: DetectionState) => {
      detectionStatesRef.current.set(detectionId, detectionState)
      onDetectionUpsertRef(detectionId, detectionState)
      scheduleDetectionExpiry(detectionId)
    },
  )

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

  const clearRuntime = useCallbackRef(() => {
    Array.from(detectionStatesRef.current.keys()).forEach((detectionId) => {
      onDetectionRemoveRef(detectionId)
    })

    cameraStatesRef.current.clear()
    detectionStatesRef.current.clear()

    detectionExpiryTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    detectionExpiryTimersRef.current.clear()

    radarUpdateTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId)
    })
    radarUpdateTimersRef.current.clear()

    setRadarUpdatesByTracker({})
  })

  useRealRadarIngestion({
    deviceIds,
    onMessages: handleRadarMessages,
  })

  React.useEffect(
    () => () => {
      clearRuntime()
    },
    [clearRuntime],
  )

  const radarUpdateItems = React.useMemo(
    () =>
      orderBy(
        Object.values(radarUpdatesByTracker),
        [(item) => item.timestampValue ?? 0, (item) => item.trackerId],
        ['desc', 'asc'],
      ),
    [radarUpdatesByTracker],
  )

  return {
    clearRuntime,
    radarUpdateItems,
  }
}
