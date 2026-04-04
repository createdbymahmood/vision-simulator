import type {CameraEntity} from '@/features/scene/types/types'

import {
  getCameraAspect,
  getEffectiveHorizontalFov,
  resolveVerticalFovFromHorizontal,
} from '@/features/scene/services/camera-optics'

const resolveAspect = (camera: CameraEntity, aspect?: number) => {
  if (typeof aspect === 'number' && Number.isFinite(aspect) && aspect > 0) {
    return aspect
  }
  return getCameraAspect(camera)
}

export const getFeedVerticalFov = (camera: CameraEntity, aspect?: number) =>
  resolveVerticalFovFromHorizontal(
    getEffectiveHorizontalFov(camera),
    resolveAspect(camera, aspect),
  )
