import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import type {CameraFeedTarget} from './camera-feed-types'

import {MAX_CAMERA_FEEDS} from './camera-feed-helpers'

interface UseCameraFeedTargetsInput {
  cameras: CameraEntity[]
  maxFeeds?: number
}

const createMutableRef = <T>(): React.MutableRefObject<T | null> => ({
  current: null,
})

export const useCameraFeedTargets = ({
  cameras,
  maxFeeds,
}: UseCameraFeedTargetsInput) => {
  const containerRefs = React.useRef(
    new Map<string, React.MutableRefObject<HTMLDivElement | null>>(),
  )
  const canvasRefs = React.useRef(
    new Map<string, React.MutableRefObject<HTMLCanvasElement | null>>(),
  )

  const orderedIds = React.useMemo(
    () => cameras.map((camera) => camera.id),
    [cameras],
  )

  const targetIds = React.useMemo(() => {
    const limit = typeof maxFeeds === 'number' ? maxFeeds : MAX_CAMERA_FEEDS
    return orderedIds.slice(0, Math.max(limit, 0))
  }, [maxFeeds, orderedIds])

  return React.useMemo<CameraFeedTarget[]>(
    () =>
      targetIds.map((id) => {
        let containerRef = containerRefs.current.get(id)
        if (!containerRef) {
          containerRef = createMutableRef<HTMLDivElement>()
          containerRefs.current.set(id, containerRef)
        }
        let canvasRef = canvasRefs.current.get(id)
        if (!canvasRef) {
          canvasRef = createMutableRef<HTMLCanvasElement>()
          canvasRefs.current.set(id, canvasRef)
        }
        return {id, containerRef, canvasRef}
      }),
    [targetIds],
  )
}
