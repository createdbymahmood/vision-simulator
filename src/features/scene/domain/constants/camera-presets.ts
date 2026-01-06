import type {Resolution} from '../types'

export interface CameraPreset {
  id: string
  name: string
  description: string
  fov: number
  depth: number
  zoom: number
  nearClipping: number
  height: number
  resolution: Resolution
  type: 'static' | 'ptz'
  fovRange?: string
  depthRange?: string
}

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: 'static-hd',
    name: 'Static HD',
    description: 'Balanced 90° view for general coverage',
    fov: 90,
    depth: 25,
    zoom: 1,
    nearClipping: 0.5,
    height: 3,
    resolution: {width: 1920, height: 1080},
    type: 'static',
    fovRange: '70°-110°',
    depthRange: '15-35 m',
  },
  {
    id: 'wide-4k',
    name: 'Wide 4K',
    description: '120° coverage with crisp 4K capture',
    fov: 120,
    depth: 18,
    zoom: 1,
    nearClipping: 0.5,
    height: 3.2,
    resolution: {width: 3840, height: 2160},
    type: 'static',
    fovRange: '100°-140°',
    depthRange: '12-26 m',
  },
  {
    id: 'telephoto',
    name: 'Telephoto',
    description: '45° lens for long corridors and gates',
    fov: 45,
    depth: 60,
    zoom: 2.5,
    nearClipping: 0.5,
    height: 3.5,
    resolution: {width: 2560, height: 1440},
    type: 'static',
    fovRange: '30°-60°',
    depthRange: '40-80 m',
  },
  {
    id: 'ptz-pro',
    name: 'PTZ Pro',
    description: 'Versatile PTZ with 80° lens and 4x zoom',
    fov: 80,
    depth: 40,
    zoom: 4,
    nearClipping: 0.5,
    height: 3.2,
    resolution: {width: 2688, height: 1520},
    type: 'ptz',
    fovRange: '60°-100°',
    depthRange: '25-55 m',
  },
  {
    id: 'panoramic',
    name: 'Panoramic',
    description: '180° wedge for wide open areas',
    fov: 180,
    depth: 22,
    zoom: 1,
    nearClipping: 0.5,
    height: 3,
    resolution: {width: 1920, height: 1080},
    type: 'static',
    fovRange: '150°-200°',
    depthRange: '14-30 m',
  },
]

export const getCameraPreset = (presetId: string) =>
  CAMERA_PRESETS.find((preset) => preset.id === presetId)
