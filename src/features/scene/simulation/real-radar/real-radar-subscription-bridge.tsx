import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'

import type {
  CameraIntrinsics,
  CameraState,
  DetectionState,
} from './real-radar-types'

import {useRealRadarRuntime} from './use-real-radar-runtime'

interface RealRadarSubscriptionBridgeProps {
  scene: SceneRoot
  focusAreaId?: string
}

interface RealRadarSubscriptionRuntimeProps {
  deviceIds: string[]
}

const defaultIntrinsics: CameraIntrinsics = {
  fx: 1_200,
  fy: 1_200,
  cx: 960,
  cy: 540,
  image_height: 1_080,
  image_width: 1_920,
}

const getDefaultCameraState = (): CameraState => ({
  camera_lat: 36.2605,
  camera_lon: 59.6168,
  camera_height_m: 8,
  yaw_deg: 45,
  pitch_deg: -10,
  roll_deg: 0,
  intrinsics: defaultIntrinsics,
})

const getUniqueDeviceIds = (deviceIds: string[]) =>
  Array.from(new Set(deviceIds.filter(Boolean)))

const getScopedRealDeviceIds = (scene: SceneRoot, focusAreaId?: string) =>
  Array.from(
    new Set(
      scene.cameras
        .filter(
          (camera) =>
            camera.sourceDeviceKind === 'real' &&
            (!focusAreaId || camera.areaId === focusAreaId),
        )
        .map((camera) => camera.sourceDeviceId)
        .filter((deviceId): deviceId is string => Boolean(deviceId)),
    ),
  )

const RealRadarSubscriptionRuntime: React.FC<
  RealRadarSubscriptionRuntimeProps
> = ({deviceIds}) => {
  const cameraStatesRef = React.useRef(new Map<string, CameraState>())
  const detectionStatesRef = React.useRef(new Map<string, DetectionState>())

  const defaultCameraState = React.useMemo(() => getDefaultCameraState(), [])
  const defaultCameraStateRef = React.useRef(defaultCameraState)
  const normalizedDeviceIds = React.useMemo(
    () => getUniqueDeviceIds(deviceIds),
    [deviceIds],
  )
  const normalizedDeviceIdsKey = React.useMemo(
    () => [...normalizedDeviceIds].sort().join('|'),
    [normalizedDeviceIds],
  )

  React.useEffect(() => {
    defaultCameraStateRef.current = defaultCameraState
  }, [defaultCameraState])

  const {clearRuntime} = useRealRadarRuntime({
    cameraStatesRef,
    detectionStatesRef,
    defaultCameraStateRef,
    defaultIntrinsics,
    deviceIds: normalizedDeviceIds,
    onCameraUpsert: () => undefined,
    onDetectionUpsert: () => undefined,
    onDetectionRemove: () => undefined,
  })

  React.useEffect(() => {
    clearRuntime()
  }, [clearRuntime, normalizedDeviceIdsKey])

  return null
}

export const RealRadarSubscriptionBridge: React.FC<
  RealRadarSubscriptionBridgeProps
> = ({scene, focusAreaId}) => {
  const scopedRealDeviceIds = React.useMemo(
    () => getScopedRealDeviceIds(scene, focusAreaId),
    [focusAreaId, scene],
  )

  if (!scopedRealDeviceIds.length) {
    return null
  }

  return <RealRadarSubscriptionRuntime deviceIds={scopedRealDeviceIds} />
}
