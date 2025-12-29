import type {Scene, SceneSelection} from './scene-types'

export const SCENE_VERSION = 1

export function createDefaultScene(): Scene {
  const now = Date.now()
  return {
    version: SCENE_VERSION,
    mode: 'canvas',
    units: 'meters',
    background: {
      type: 'solid',
      value: '#f7f7f7',
      opacity: 1,
      scale: 1,
      rotation: 0,
      position: {x: 0, y: 0},
      locked: false,
    },
    areas: [],
    walls: [],
    shapes: [],
    cameras: [],
    people: [],
    meta: {
      name: 'Untitled Scene',
      createdAt: now,
      updatedAt: now,
    },
  }
}

export function createInitialSelection(): SceneSelection {
  return {
    selectedEntityId: null,
    selectedEntityKind: null,
    mode: 'single',
  }
}
