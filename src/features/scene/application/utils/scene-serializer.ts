import type {SceneRoot} from '@/features/scene/domain/types'

export const serializeScene = (scene: SceneRoot) =>
  JSON.stringify(scene, null, 2)

export class SceneParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SceneParseError'
  }
}

export const parseScene = (payload: string): SceneRoot => {
  try {
    const parsed = JSON.parse(payload)
    return parsed as SceneRoot
  } catch (error) {
    throw new SceneParseError('Failed to parse scene JSON')
  }
}
