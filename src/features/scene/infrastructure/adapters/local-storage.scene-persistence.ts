import type {ScenePersistencePort} from '@/features/scene/application/ports/scene-persistence.port'
import type {SceneRoot} from '@/features/scene/domain/types'

import {
  parseScene,
  serializeScene,
} from '@/features/scene/application/utils/scene-serializer'

const STORAGE_KEY = 'computer-vision-simulator:scene'

const hasLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const createLocalStorageScenePersistence = (): ScenePersistencePort => ({
  load: async () => {
    if (!hasLocalStorage()) {
      return null
    }

    const payload = window.localStorage.getItem(STORAGE_KEY)
    if (!payload) {
      return null
    }

    return parseScene(payload)
  },

  save: async (scene: SceneRoot) => {
    if (!hasLocalStorage()) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, serializeScene(scene))
  },

  exportToJson: async (scene: SceneRoot) => serializeScene(scene),

  importFromJson: async (payload: string) => parseScene(payload),

  clear: async () => {
    if (!hasLocalStorage()) {
      return
    }

    window.localStorage.removeItem(STORAGE_KEY)
  },
})
