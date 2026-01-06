import type {CameraEntity, GeoPoint, PtzState} from '../types'

import {assignCameraColor} from './color-assignment'
import {getCameraPreset} from '../constants/camera-presets'

export interface CreateCameraParams {
  id: string
  areaId: string
  presetId: string
  position: GeoPoint
  color?: string
  direction?: number
}

const createDefaultPtzState = (zoom: number): PtzState => ({
  pan: 0,
  tilt: 0,
  zoom,
  limits: {
    panMin: -180,
    panMax: 180,
    tiltMin: -60,
    tiltMax: 90,
    zoomMin: 1,
    zoomMax: Math.max(zoom, 4),
  },
})

export const createCameraEntity = (
  params: CreateCameraParams,
  index: number,
): CameraEntity => {
  const preset = getCameraPreset(params.presetId)

  const color = params.color ?? assignCameraColor(index)
  const fov = preset?.fov ?? 90
  const depth = preset?.depth ?? 20
  const zoom = preset?.zoom ?? 1
  const nearClipping = preset?.nearClipping ?? 0.5
  const height = preset?.height ?? 3

  return {
    id: params.id,
    type: 'camera',
    areaId: params.areaId,
    typePreset: preset?.id ?? params.presetId,
    x: params.position[0],
    y: params.position[1],
    height,
    direction: params.direction ?? 0,
    fov,
    depth,
    zoom,
    nearClipping,
    resolution: preset?.resolution ?? {width: 1920, height: 1080},
    color,
    ptz: createDefaultPtzState(zoom),
    ptzPresets: [],
    showCollisions: true,
  }
}
