import type {Scene} from '../core/scene-types'
import type {ScenePersistencePort} from '../ports/scene-persistence-port'

const DEFAULT_STORAGE_KEY = 'cv-sim.scene'

function getStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function createLocalStorageSceneAdapter(
  key = DEFAULT_STORAGE_KEY,
): ScenePersistencePort & {loadSceneSync: () => Scene | null} {
  const storageKey = key

  const loadSceneSync = (): Scene | null => {
    const storage = getStorage()
    if (!storage) {
      return null
    }
    const raw = storage.getItem(storageKey)
    if (!raw) {
      return null
    }
    try {
      return JSON.parse(raw) as Scene
    } catch (error) {
      console.error('Failed to parse scene from storage', error)
      return null
    }
  }

  const loadScene = async (): Promise<Scene | null> => {
    return loadSceneSync()
  }

  const saveScene = async (scene: Scene): Promise<void> => {
    const storage = getStorage()
    if (!storage) {
      return
    }

    storage.setItem(storageKey, JSON.stringify(scene))
  }

  const clearScene = async (): Promise<void> => {
    const storage = getStorage()
    if (!storage) {
      return
    }

    storage.removeItem(storageKey)
  }

  return {
    loadScene,
    saveScene,
    clearScene,
    loadSceneSync,
  }
}
