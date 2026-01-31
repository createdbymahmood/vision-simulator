import type {CameraEntity, GeoPoint, PtzState} from '../types'

import {getCameraPreset} from '../constants/camera-presets'
import {assignCameraColor} from './color-assignment'

export interface CreateCameraParams {
  id: string
  areaId: string
  presetId: string
  position: GeoPoint
  color?: string
  direction?: number
}

const DEFAULT_CAMERA_PRESET = {
  fov: 90,
  depth: 20,
  zoom: 1,
  nearClipping: 0.5,
  height: 3,
  resolution: {width: 1920, height: 1080},
}

const createDefaultPtzState = (zoom: number): PtzState => ({
  pan: 0,
  tilt: 0,
  zoom,
  limits: {
    panMin: 0,
    panMax: 360,
    tiltMin: -45,
    tiltMax: 90,
    zoomMin: 1,
    zoomMax: 10,
  },
})

export const createCameraEntity = (
  params: CreateCameraParams,
  index: number,
): CameraEntity => {
  const preset = getCameraPreset(params.presetId)
  const resolvedPreset = {...DEFAULT_CAMERA_PRESET, ...(preset ?? {})}

  const color = params.color ?? assignCameraColor(index)

  return {
    id: params.id,
    type: 'camera',
    name: params.id,
    areaId: params.areaId,
    typePreset: preset?.id ?? params.presetId,
    x: params.position[0],
    y: params.position[1],
    height: resolvedPreset.height,
    direction: params.direction ?? 0,
    fov: resolvedPreset.fov,
    depth: resolvedPreset.depth,
    zoom: resolvedPreset.zoom,
    nearClipping: resolvedPreset.nearClipping,
    resolution: resolvedPreset.resolution,
    color,
    ptz: createDefaultPtzState(resolvedPreset.zoom),
    ptzPresets: [],
    showCollisions: true,
  }
}
