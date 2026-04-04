import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import type {CameraFeedTarget} from './camera-feed-types'

import {MAX_CAMERA_FEEDS} from './camera-feed-helpers'

interface UseCameraFeedTargetsInput {
  cameras: CameraEntity[]
}

const createMutableRef = <T>(): React.MutableRefObject<T | null> => ({
  current: null,
})

export const useCameraFeedTargets = ({cameras}: UseCameraFeedTargetsInput) => {
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

  const targetIds = React.useMemo(
    () => orderedIds.slice(0, MAX_CAMERA_FEEDS),
    [orderedIds],
  )

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
