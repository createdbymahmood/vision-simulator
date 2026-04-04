import type {CameraEntity, CameraOptics, GeoPoint, PtzState} from '@/features/scene/types/types'

import {createDefaultCameraOptics} from './camera-optics'
import {assignCameraColor} from './color-assignment'

export interface CreateCameraParams {
  id: string
  areaId: string
  sourceDeviceId: string
  sourceDeviceName: string
  sourceDeviceKind: 'real' | 'virtual'
  name?: string
  optics?: Partial<CameraOptics>
  position: GeoPoint
  color?: string
  pan?: number
}

const createDefaultPtzState = (zoom: number, pan: number): PtzState => ({
  pan,
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
  const resolvedOptics = createDefaultCameraOptics(params.optics)
  const color = params.color ?? assignCameraColor(index)
  const pan = params.pan ?? 0

  return {
    id: params.id,
    type: 'camera',
    name: params.name ?? params.sourceDeviceName ?? params.id,
    areaId: params.areaId,
    sourceDeviceId: params.sourceDeviceId,
    sourceDeviceName: params.sourceDeviceName,
    sourceDeviceKind: params.sourceDeviceKind,
    x: params.position[0],
    y: params.position[1],
    height: resolvedOptics.height,
    fovHorizontal: resolvedOptics.fovHorizontal,
    fovVertical: resolvedOptics.fovVertical,
    depth: resolvedOptics.depth,
    zoom: resolvedOptics.zoom,
    resolution: resolvedOptics.resolution,
    color,
    sourceDeviceFeatures: [],
    ptz: createDefaultPtzState(resolvedOptics.zoom, pan),
  }
}
