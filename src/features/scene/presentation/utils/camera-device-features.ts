import type {
  DeviceFeature,
  DevicePopulate,
} from '@/data-provider/api/services/v2/api.schemas'
import type {
  CameraEntity,
  CameraOptics,
  CameraPlacementProfile,
  CameraSourceFeature,
} from '@/features/scene/domain/types'

import {
  createDefaultCameraOptics,
  getCameraAspect,
  resolveVerticalFovFromHorizontal,
} from '@/features/scene/domain/services/camera-optics'

const CAMERA_FEATURE_FIELDS = {
  resolutionWidth: 'camera_resolution_width',
  resolutionHeight: 'camera_resolution_height',
  fovHorizontal: 'camera_fov_horizontal',
  fovVertical: 'camera_fov_vertical',
  zoomOptical: 'camera_zoom_optical_value',
  zoomDigital: 'camera_zoom_digital_value',
} as const

const CAMERA_DEPTH_FEATURE_FIELDS = [
  'camera_depth',
  'camera_range',
  'camera_detection_range',
  'camera_view_depth',
] as const

const CAMERA_HEIGHT_FEATURE_FIELDS = [
  'camera_height',
  'camera_mount_height',
  'camera_install_height',
] as const

const findFeature = (features: CameraSourceFeature[], field: string) =>
  features.find((feature) => feature.field === field)

const parseFeatureNumber = (features: CameraSourceFeature[], field: string) => {
  const value = findFeature(features, field)?.value
  if (!value) {
    return undefined
  }
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }
  return parsed
}

const pickFeatureNumber = (
  features: CameraSourceFeature[],
  fields: readonly string[],
) => {
  for (const field of fields) {
    const parsed = parseFeatureNumber(features, field)
    if (parsed !== undefined) {
      return parsed
    }
  }
  return undefined
}

const pickFeatureNumberByKeyword = (
  features: CameraSourceFeature[],
  keywords: readonly string[],
) => {
  for (const feature of features) {
    const searchable =
      `${feature.field ?? ''}|${feature.path ?? ''}|${feature.label ?? ''}`.toLowerCase()
    if (!keywords.some((keyword) => searchable.includes(keyword))) {
      continue
    }
    const parsed = Number.parseFloat(feature.value ?? '')
    if (!Number.isFinite(parsed) || parsed <= 0) {
      continue
    }
    return parsed
  }
  return undefined
}

const cloneFeature = (feature: CameraSourceFeature): CameraSourceFeature => ({
  field: feature.field,
  label: feature.label,
  path: feature.path,
  unit: feature.unit,
  value: feature.value,
})

const toValue = (value: number) => String(value)

const upsertFeatureValue = ({
  features,
  field,
  fallback,
  value,
}: {
  features: CameraSourceFeature[]
  field: string
  fallback: Omit<CameraSourceFeature, 'field' | 'value'>
  value: string
}) => {
  const existingIndex = features.findIndex((feature) => feature.field === field)
  if (existingIndex >= 0) {
    features[existingIndex] = {
      ...features[existingIndex],
      value,
    }
    return
  }

  features.push({
    field,
    ...fallback,
    value,
  })
}

const resolveFeatureField = (
  features: CameraSourceFeature[],
  fields: readonly string[],
  defaultField: string,
) => {
  const existing = fields.find((field) =>
    features.some((feature) => feature.field === field),
  )
  return existing ?? defaultField
}

export const toCameraSourceFeatures = (
  features?: DeviceFeature[],
): CameraSourceFeature[] => (features ?? []).map(cloneFeature)

export const createCameraOpticsFromFeatures = (
  features: CameraSourceFeature[],
): CameraOptics => {
  const resolutionWidth = parseFeatureNumber(
    features,
    CAMERA_FEATURE_FIELDS.resolutionWidth,
  )
  const resolutionHeight = parseFeatureNumber(
    features,
    CAMERA_FEATURE_FIELDS.resolutionHeight,
  )
  const resolution =
    resolutionWidth && resolutionHeight
      ? {
          width: Math.round(resolutionWidth),
          height: Math.round(resolutionHeight),
        }
      : undefined
  const aspect = getCameraAspect(resolution)

  const fovHorizontal = parseFeatureNumber(
    features,
    CAMERA_FEATURE_FIELDS.fovHorizontal,
  )
  const fovVertical =
    parseFeatureNumber(features, CAMERA_FEATURE_FIELDS.fovVertical) ??
    (fovHorizontal
      ? resolveVerticalFovFromHorizontal(fovHorizontal, aspect)
      : undefined)

  const zoom =
    parseFeatureNumber(features, CAMERA_FEATURE_FIELDS.zoomOptical) ??
    parseFeatureNumber(features, CAMERA_FEATURE_FIELDS.zoomDigital)
  const depth =
    pickFeatureNumber(features, CAMERA_DEPTH_FEATURE_FIELDS) ??
    pickFeatureNumberByKeyword(features, ['depth', 'range'])
  const height =
    pickFeatureNumber(features, CAMERA_HEIGHT_FEATURE_FIELDS) ??
    pickFeatureNumberByKeyword(features, ['height'])

  return createDefaultCameraOptics({
    fovHorizontal,
    fovVertical,
    depth,
    zoom,
    height,
    resolution,
  })
}

export const createCameraPlacementProfileFromDevice = (
  device: DevicePopulate,
): CameraPlacementProfile => {
  const features = toCameraSourceFeatures(device.features)
  const optics = createCameraOpticsFromFeatures(features)

  return {
    id: device.id ?? device.deviceId ?? 'unknown-device',
    name: device.name ?? device.deviceId ?? 'IP Camera',
    description: device.description ?? 'IP camera',
    sourceDeviceKind: 'real',
    optics,
    features,
  }
}

export const mergeCameraFeaturesWithOptics = (
  currentFeatures: CameraSourceFeature[],
  optics: CameraOptics,
): CameraSourceFeature[] => {
  const merged = currentFeatures.map(cloneFeature)

  upsertFeatureValue({
    features: merged,
    field: CAMERA_FEATURE_FIELDS.fovHorizontal,
    fallback: {
      label: 'horizontal fov',
      path: 'camera_fov',
      unit: '°',
    },
    value: toValue(optics.fovHorizontal),
  })
  upsertFeatureValue({
    features: merged,
    field: CAMERA_FEATURE_FIELDS.fovVertical,
    fallback: {
      label: 'vertical fov',
      path: 'camera_fov',
      unit: '°',
    },
    value: toValue(optics.fovVertical),
  })
  upsertFeatureValue({
    features: merged,
    field: CAMERA_FEATURE_FIELDS.resolutionWidth,
    fallback: {
      label: 'resolution width',
      path: 'camera_resolution',
      unit: 'px',
    },
    value: toValue(Math.round(optics.resolution.width)),
  })
  upsertFeatureValue({
    features: merged,
    field: CAMERA_FEATURE_FIELDS.resolutionHeight,
    fallback: {
      label: 'resolution height',
      path: 'camera_resolution',
      unit: 'px',
    },
    value: toValue(Math.round(optics.resolution.height)),
  })
  upsertFeatureValue({
    features: merged,
    field: CAMERA_FEATURE_FIELDS.zoomOptical,
    fallback: {
      label: 'optical zoom',
      path: 'camera_zoom_optical',
      unit: 'x',
    },
    value: toValue(optics.zoom),
  })

  if (
    merged.some(
      (feature) => feature.field === CAMERA_FEATURE_FIELDS.zoomDigital,
    )
  ) {
    upsertFeatureValue({
      features: merged,
      field: CAMERA_FEATURE_FIELDS.zoomDigital,
      fallback: {
        label: 'digital zoom',
        path: 'camera_zoom_digital',
        unit: 'x',
      },
      value: toValue(optics.zoom),
    })
  }

  const depthField = resolveFeatureField(
    merged,
    CAMERA_DEPTH_FEATURE_FIELDS,
    CAMERA_DEPTH_FEATURE_FIELDS[0],
  )
  upsertFeatureValue({
    features: merged,
    field: depthField,
    fallback: {
      label: 'depth',
      path: 'camera_depth',
      unit: 'm',
    },
    value: toValue(optics.depth),
  })

  const heightField = resolveFeatureField(
    merged,
    CAMERA_HEIGHT_FEATURE_FIELDS,
    CAMERA_HEIGHT_FEATURE_FIELDS[0],
  )
  upsertFeatureValue({
    features: merged,
    field: heightField,
    fallback: {
      label: 'height',
      path: 'camera_mount',
      unit: 'm',
    },
    value: toValue(optics.height),
  })

  return merged
}

export const mergeCameraFeaturesWithCamera = (
  camera: Pick<
    CameraEntity,
    | 'depth'
    | 'fovHorizontal'
    | 'fovVertical'
    | 'height'
    | 'resolution'
    | 'sourceDeviceFeatures'
    | 'zoom'
  >,
) =>
  mergeCameraFeaturesWithOptics(camera.sourceDeviceFeatures, {
    depth: camera.depth,
    fovHorizontal: camera.fovHorizontal,
    fovVertical: camera.fovVertical,
    height: camera.height,
    resolution: camera.resolution,
    zoom: camera.zoom,
  })
