import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import type {CameraFeedTarget} from './simulation-scene'

interface UseCameraFeedTargetsInput {
  cameras: CameraEntity[]
  activeCameraId?: string
}

const getOrderedCameraIds = (
  cameras: CameraEntity[],
  activeCameraId?: string,
) => {
  const ids = cameras.map((camera) => camera.id)
  if (!activeCameraId || !ids.includes(activeCameraId)) {
    return ids
  }
  return [activeCameraId, ...ids.filter((id) => id !== activeCameraId)]
}

export const useCameraFeedTargets = ({
  cameras,
  activeCameraId,
}: UseCameraFeedTargetsInput) => {
  const refs = React.useRef(new Map<string, React.RefObject<HTMLDivElement>>())

  const orderedIds = React.useMemo(
    () => getOrderedCameraIds(cameras, activeCameraId),
    [activeCameraId, cameras],
  )

  const targetIds = orderedIds

  return React.useMemo<CameraFeedTarget[]>(
    () =>
      targetIds.map((id) => {
        let ref = refs.current.get(id)
        if (!ref) {
          ref = React.createRef<HTMLDivElement>()
          refs.current.set(id, ref)
        }
        return {id, ref}
      }),
    [targetIds],
  )
}
