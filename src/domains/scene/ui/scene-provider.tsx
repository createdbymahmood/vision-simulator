import type {PropsWithChildren} from 'react'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React, {useEffect, useMemo} from 'react'

import type {Scene} from '../core/scene-types'
import type {ScenePersistencePort} from '../ports/scene-persistence-port'

import {createLocalStorageSceneAdapter} from '../adapters/local-storage-scene-adapter'
import {sceneStore} from './scene-store'

type SceneProviderProps = PropsWithChildren<{
  persistence?: ScenePersistencePort
}>

interface ScenePersistenceBootstrapProps {
  adapter: ScenePersistencePort
}

const ScenePersistenceBootstrap: React.FC<ScenePersistenceBootstrapProps> = ({
  adapter,
}) => {
  const hydrateScene = sceneStore.useStore((state) => state.hydrateScene)
  const markSceneSaved = sceneStore.useStore((state) => state.markSceneSaved)
  const setAutosaveStatus = sceneStore.useStore(
    (state) => state.setAutosaveStatus,
  )

  const handleSceneSave = useCallbackRef(async (nextScene: Scene) => {
    setAutosaveStatus('saving')
    try {
      await adapter.saveScene(nextScene)
      markSceneSaved(Date.now())
    } finally {
      setAutosaveStatus('idle')
    }
  })

  useEffect(() => {
    let cancelled = false
    const store = sceneStore.getState()
    const existingScene = store?.getState().scene

    adapter.loadScene().then(async (stored) => {
      if (cancelled) {
        return
      }

      if (stored) {
        hydrateScene(stored)
        markSceneSaved(Date.now())
        return
      }

      if (existingScene) {
        setAutosaveStatus('saving')
        try {
          await adapter.saveScene(existingScene)
          markSceneSaved(Date.now())
        } finally {
          setAutosaveStatus('idle')
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [adapter, hydrateScene, markSceneSaved, setAutosaveStatus])

  useEffect(() => {
    const store = sceneStore.getState()
    if (!store) {
      return
    }

    const unsubscribe = store.subscribe((state, previousState) => {
      if (state.scene === previousState.scene) {
        return
      }
      handleSceneSave(state.scene)
    })
    return unsubscribe
  }, [handleSceneSave])

  return null
}

export const SceneProvider: React.FC<SceneProviderProps> = ({
  children,
  persistence,
}) => {
  const adapter = useMemo(
    () => persistence ?? createLocalStorageSceneAdapter(),
    [persistence],
  )

  const initialScene = useMemo(() => {
    if ('loadSceneSync' in adapter) {
      const stored = (
        adapter as ReturnType<typeof createLocalStorageSceneAdapter>
      ).loadSceneSync()
      if (stored) {
        return stored
      }
    }
    return undefined
  }, [adapter])

  return (
    <sceneStore.Provider initialState={{scene: initialScene}}>
      <ScenePersistenceBootstrap adapter={adapter} />
      {children}
    </sceneStore.Provider>
  )
}

SceneProvider.displayName = 'scene-provider'
ScenePersistenceBootstrap.displayName = 'scene-persistence-bootstrap'
