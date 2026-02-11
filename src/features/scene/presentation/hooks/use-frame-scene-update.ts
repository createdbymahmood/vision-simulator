import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

type SceneMutator = (scene: SceneRoot) => void

interface UseFrameSceneUpdateInput {
  updateScene: (updater: (scene: SceneRoot) => void) => SceneRoot
}

interface UseFrameSceneUpdateResult {
  flushSceneUpdate: () => SceneRoot | null
  scheduleSceneUpdate: (
    updater: SceneMutator,
    onApplied?: (scene: SceneRoot) => void,
  ) => void
}

export const useFrameSceneUpdate = ({
  updateScene,
}: UseFrameSceneUpdateInput): UseFrameSceneUpdateResult => {
  const frameRef = React.useRef<number | null>(null)
  const pendingMutatorsRef = React.useRef<SceneMutator[]>([])
  const pendingCallbacksRef = React.useRef<((scene: SceneRoot) => void)[]>([])

  const flushSceneUpdate = React.useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    if (pendingMutatorsRef.current.length === 0) {
      pendingCallbacksRef.current = []
      return null
    }

    const mutators = pendingMutatorsRef.current
    const callbacks = pendingCallbacksRef.current
    pendingMutatorsRef.current = []
    pendingCallbacksRef.current = []

    const updated = updateScene((scene) => {
      mutators.forEach((mutator) => {
        mutator(scene)
      })
    })

    callbacks.forEach((callback) => {
      callback(updated)
    })

    return updated
  }, [updateScene])

  const scheduleSceneUpdate = React.useCallback(
    (updater: SceneMutator, onApplied?: (scene: SceneRoot) => void) => {
      pendingMutatorsRef.current.push(updater)
      if (onApplied) {
        pendingCallbacksRef.current.push(onApplied)
      }

      if (frameRef.current !== null) {
        return
      }

      if (typeof window === 'undefined') {
        flushSceneUpdate()
        return
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        flushSceneUpdate()
      })
    },
    [flushSceneUpdate],
  )

  React.useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = null
      pendingMutatorsRef.current = []
      pendingCallbacksRef.current = []
    },
    [],
  )

  return {
    flushSceneUpdate,
    scheduleSceneUpdate,
  }
}
