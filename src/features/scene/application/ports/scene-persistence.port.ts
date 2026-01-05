import type {SceneRoot} from '@/features/scene/domain/types'

export interface ScenePersistencePort {
  load: () => Promise<SceneRoot | null>
  save: (scene: SceneRoot) => Promise<void>
  exportToJson: (scene: SceneRoot) => Promise<string>
  importFromJson: (payload: string) => Promise<SceneRoot>
  clear: () => Promise<void>
}
