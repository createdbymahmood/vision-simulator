import React from 'react'

import type {CameraEntity} from '@/features/scene/domain/types'

import type {CameraFeedTarget} from './camera-feed-types'
import {MAX_CAMERA_FEEDS} from './camera-feed-helpers'

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
  const containerRefs = React.useRef(
    new Map<string, React.RefObject<HTMLDivElement>>(),
  )
  const canvasRefs = React.useRef(
    new Map<string, React.RefObject<HTMLCanvasElement>>(),
  )

  const orderedIds = React.useMemo(
    () => getOrderedCameraIds(cameras, activeCameraId),
    [activeCameraId, cameras],
  )

  const targetIds = React.useMemo(
    () => orderedIds.slice(0, MAX_CAMERA_FEEDS),
    [orderedIds],
  )

  return React.useMemo<CameraFeedTarget[]>(
    () =>
      targetIds.map((id) => {
        let containerRef = containerRefs.current.get(id)
        if (!containerRef) {
          containerRef = React.createRef<HTMLDivElement>()
          containerRefs.current.set(id, containerRef)
        }
        let canvasRef = canvasRefs.current.get(id)
        if (!canvasRef) {
          canvasRef = React.createRef<HTMLCanvasElement>()
          canvasRefs.current.set(id, canvasRef)
        }
        return {id, containerRef, canvasRef}
      }),
    [targetIds],
  )
}
