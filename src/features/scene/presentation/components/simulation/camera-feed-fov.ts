import type {CameraEntity} from '@/features/scene/domain/types'

import {getEffectiveVerticalFov} from '@/features/scene/domain/services/camera-optics'

export const getFeedVerticalFov = (camera: CameraEntity) =>
  getEffectiveVerticalFov(camera)
