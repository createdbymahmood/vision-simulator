import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

interface SceneRevisionState {
  currentRevision: number
  lastSavedRevision: number
  currentSceneSignature: string
  lastSavedSceneSignature: string
}

interface SaveSnapshot {
  sceneSignature: string
  revision: number
}

interface UseSceneDirtyStateParams {
  enabled: boolean
  scene: SceneRoot
}

const createSceneSignature = (scene: SceneRoot) => JSON.stringify(scene)

export const useSceneDirtyState = ({
  enabled,
  scene,
}: UseSceneDirtyStateParams) => {
  const currentSceneSignature = React.useMemo(
    () => createSceneSignature(scene),
    [scene],
  )

  const [revisionState, setRevisionState] = React.useState<SceneRevisionState>(
    () => ({
      currentRevision: 0,
      lastSavedRevision: 0,
      currentSceneSignature,
      lastSavedSceneSignature: currentSceneSignature,
    }),
  )

  React.useEffect(() => {
    setRevisionState((state) => {
      if (state.currentSceneSignature === currentSceneSignature) {
        return state
      }

      return {
        ...state,
        currentRevision: state.currentRevision + 1,
        currentSceneSignature,
      }
    })
  }, [currentSceneSignature])

  const createSaveSnapshot = useCallbackRef(
    (sceneToSave: SceneRoot): SaveSnapshot => {
      return {
        sceneSignature: createSceneSignature(sceneToSave),
        revision: revisionState.currentRevision,
      }
    },
  )

  const markSaved = useCallbackRef((snapshot: SaveSnapshot) => {
    setRevisionState((state) => {
      return {
        ...state,
        lastSavedRevision: Math.max(state.lastSavedRevision, snapshot.revision),
        lastSavedSceneSignature: snapshot.sceneSignature,
      }
    })
  })

  const isDirty =
    enabled &&
    revisionState.currentSceneSignature !==
      revisionState.lastSavedSceneSignature

  return {
    isDirty,
    createSaveSnapshot,
    markSaved,
  }
}
