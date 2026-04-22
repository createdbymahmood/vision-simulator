import type {
  CameraOptics,
  CameraPlacementProfile,
  CameraSourceFeature,
} from '@/features/scene/types/types'

import {createDefaultCameraOptics} from '@/features/scene/services/camera-optics'

export interface PlaceDeviceOption {
  id: string
  name: string
  description: string
  profile: CameraPlacementProfile
  fovHorizontal: number
  fovVertical: number
  depth: number
}

interface VirtualDeviceDefinition {
  id: string
  name: string
  description: string
  optics: Partial<CameraOptics>
}

const toPlaceDeviceOption = ({
  id,
  name,
  description,
  profile,
}: {
  id: string
  name: string
  description: string
  profile: CameraPlacementProfile
}): PlaceDeviceOption => ({
  id,
  name,
  description,
  profile,
  fovHorizontal: profile.optics.fovHorizontal,
  fovVertical: profile.optics.fovVertical,
  depth: profile.optics.depth,
})

const createVirtualCameraFeatures = ({
  id,
  name,
  optics,
}: {
  id: string
  name: string
  optics: CameraOptics
}): CameraSourceFeature[] => [
  {
    field: 'camera_fov_horizontal',
    label: 'horizontal fov',
    path: 'camera_fov',
    unit: '°',
    value: String(optics.fovHorizontal),
  },
  {
    field: 'camera_fov_vertical',
    label: 'vertical fov',
    path: 'camera_fov',
    unit: '°',
    value: String(optics.fovVertical),
  },
  {
    field: 'camera_resolution_width',
    label: 'resolution width',
    path: 'camera_resolution',
    unit: 'px',
    value: String(optics.resolution.width),
  },
  {
    field: 'camera_resolution_height',
    label: 'resolution height',
    path: 'camera_resolution',
    unit: 'px',
    value: String(optics.resolution.height),
  },
  {
    field: 'camera_zoom_optical_value',
    label: 'optical zoom',
    path: 'camera_zoom_optical',
    unit: 'x',
    value: String(optics.zoom),
  },
  {
    field: 'camera_depth',
    label: 'depth',
    path: 'camera_depth',
    unit: 'm',
    value: String(optics.depth),
  },
  {
    field: 'camera_height',
    label: 'height',
    path: 'camera_mount',
    unit: 'm',
    value: String(optics.height),
  },
  {
    field: 'camera_model',
    label: 'model',
    path: 'camera_system_info',
    unit: 'string',
    value: name,
  },
  {
    field: 'camera_manufacturer',
    label: 'manufacturer',
    path: 'camera_system_info',
    unit: 'string',
    value: 'Virtual',
  },
  {
    field: 'camera_virtual_id',
    label: 'virtual id',
    path: 'camera_virtual',
    unit: 'string',
    value: id,
  },
]

const createVirtualPlacementProfile = (
  definition: VirtualDeviceDefinition,
): CameraPlacementProfile => {
  const id = `virtual-${definition.id}`
  const optics = createDefaultCameraOptics(definition.optics)
  return {
    id,
    name: definition.name,
    description: definition.description,
    sourceDeviceKind: 'virtual',
    optics,
    features: createVirtualCameraFeatures({
      id,
      name: definition.name,
      optics,
    }),
  }
}

const VIRTUAL_DEVICE_DEFINITIONS: readonly VirtualDeviceDefinition[] = [
  {
    id: 'static-hd',
    name: 'Static HD',
    description: 'Balanced 90° view for general coverage',
    optics: {
      fovHorizontal: 90,
      depth: 25,
      zoom: 1,
      height: 3,
      resolution: {width: 1920, height: 1080},
    },
  },
  {
    id: 'wide-4k',
    name: 'Wide 4K',
    description: '120° coverage with crisp 4K capture',
    optics: {
      fovHorizontal: 120,
      depth: 18,
      zoom: 1,
      height: 3.2,
      resolution: {width: 3840, height: 2160},
    },
  },
  {
    id: 'telephoto',
    name: 'Telephoto',
    description: '45° lens for long corridors and gates',
    optics: {
      fovHorizontal: 45,
      depth: 60,
      zoom: 2.5,
      height: 3.5,
      resolution: {width: 2560, height: 1440},
    },
  },
  {
    id: 'ptz-pro',
    name: 'PTZ Pro',
    description: 'Versatile PTZ with 80° lens and 4x zoom',
    optics: {
      fovHorizontal: 80,
      depth: 40,
      zoom: 4,
      height: 3.2,
      resolution: {width: 2688, height: 1520},
    },
  },
  {
    id: 'panoramic',
    name: 'Panoramic',
    description: '180° wedge for wide open areas',
    optics: {
      fovHorizontal: 180,
      depth: 22,
      zoom: 1,
      height: 3,
      resolution: {width: 1920, height: 1080},
    },
  },
]

const VIRTUAL_PLACE_DEVICE_OPTIONS: PlaceDeviceOption[] =
  VIRTUAL_DEVICE_DEFINITIONS.map((definition) => {
    const profile = createVirtualPlacementProfile(definition)
    return toPlaceDeviceOption({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      profile,
    })
  })

export const getVirtualPlaceDeviceOptions = () => VIRTUAL_PLACE_DEVICE_OPTIONS
