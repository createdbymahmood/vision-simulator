import type {ScenePersistencePort} from '@/features/scene/adapters/scene-persistence.port'
import type {SceneRoot} from '@/features/scene/types/types'

import {
  parseScene,
  serializeScene,
} from '@/features/scene/utils/scene-serializer'

const STORAGE_KEY = 'computer-vision-simulator:scene'

const hasLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const createLocalStorageScenePersistence = (): ScenePersistencePort => ({
  load: async () => {
    if (!hasLocalStorage()) {
      return null
    }

    void STORAGE_KEY
    // NOTE: Local storage persistence is temporarily disabled.
    // Do not remove the commented code below; it will be re-enabled later.
    // const payload = window.localStorage.getItem(STORAGE_KEY)
    // if (!payload) {
    //   return null
    // }
    // return parseScene(payload)
    return null
  },

  save: async (scene: SceneRoot) => {
    if (!hasLocalStorage()) {
      return
    }

    void scene
    void STORAGE_KEY
    // NOTE: Local storage persistence is temporarily disabled.
    // Do not remove the commented code below; it will be re-enabled later.
    // window.localStorage.setItem(STORAGE_KEY, serializeScene(scene))
  },

  exportToJson: async (scene: SceneRoot) => serializeScene(scene),

  importFromJson: async (payload: string) => parseScene(payload),

  clear: async () => {
    if (!hasLocalStorage()) {
      return
    }

    void STORAGE_KEY
    // NOTE: Local storage persistence is temporarily disabled.
    // Do not remove the commented code below; it will be re-enabled later.
    // window.localStorage.removeItem(STORAGE_KEY)
  },
})
