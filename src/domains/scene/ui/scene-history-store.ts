import type {StateCreator} from 'zustand'

import {createZustandContextStore} from '@/components/shared/zustand'

import type {Scene} from '../core/scene-types'

interface SceneHistoryState {
  limit: number
  past: Scene[]
  future: Scene[]
}

interface SceneHistoryActions {
  captureSnapshot: (scene: Scene) => void
  undo: (currentScene: Scene) => Scene | null
  redo: (currentScene: Scene) => Scene | null
  clearHistory: () => void
  setLimit: (next: number) => void
}

export type SceneHistoryStore = SceneHistoryActions & SceneHistoryState

function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene
}

const DEFAULT_HISTORY_LIMIT = 200

const createHistoryStore: (initial: {}) => StateCreator<SceneHistoryStore> =
  (initial) => (set, get) => ({
    limit: (initial as {limit?: number}).limit ?? DEFAULT_HISTORY_LIMIT,
    past: [],
    future: [],
    captureSnapshot: (scene) =>
      set((state) => {
        const snapshot = cloneScene(scene)
        const trimmedPast =
          state.past.length >= state.limit
            ? [...state.past.slice(-(state.limit - 1)), snapshot]
            : [...state.past, snapshot]
        return {
          past: trimmedPast,
          future: [],
        }
      }),
    undo: (currentScene) => {
      const state = get()
      if (!state.past.length) {
        return null
      }
      const previousScene = state.past[state.past.length - 1]
      set({
        past: state.past.slice(0, -1),
        future: [...state.future, cloneScene(currentScene)],
      })
      return previousScene
    },
    redo: (currentScene) => {
      const state = get()
      if (!state.future.length) {
        return null
      }
      const nextScene = state.future[state.future.length - 1]
      set({
        future: state.future.slice(0, -1),
        past: [...state.past, cloneScene(currentScene)],
      })
      return nextScene
    },
    clearHistory: () =>
      set({
        past: [],
        future: [],
      }),
    setLimit: (next) =>
      set((state) => ({
        limit: Math.max(1, next),
        past: state.past.slice(-(Math.max(1, next) - 1)),
        future: [],
      })),
  })

export const sceneHistoryStore = createZustandContextStore<
  SceneHistoryStore,
  {}
>(createHistoryStore)

export const useSceneHistoryStore = sceneHistoryStore.useStore

export const SceneHistoryProvider = sceneHistoryStore.Provider

SceneHistoryProvider.displayName = 'scene-history-provider'
