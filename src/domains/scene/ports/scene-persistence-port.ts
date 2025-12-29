import type {Scene} from '../core/scene-types'

export interface ScenePersistencePort {
  loadScene: () => Promise<Scene | null>
  saveScene: (scene: Scene) => Promise<void>
  clearScene: () => Promise<void>
}
