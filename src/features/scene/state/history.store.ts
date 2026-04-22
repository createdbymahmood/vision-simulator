import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'
import {persist} from 'zustand/middleware'

import type {SceneRoot} from '@/features/scene/types/types'

import {createZustandContextStore} from '@/components/shared/zustand'
import {jsonLocalStorage} from '@/lib/zustand-persist'

const DEFAULT_HISTORY_CAPACITY = 100

const cloneScene = (scene: SceneRoot) =>
  typeof structuredClone === 'function'
    ? (structuredClone(scene) as SceneRoot)
    : (JSON.parse(JSON.stringify(scene)) as SceneRoot)

export interface HistoryEntry {
  scene: SceneRoot
  description?: string
  timestamp: number
}

export interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  capacity: number
  applying: boolean

  record: (scene: SceneRoot, description?: string) => HistoryEntry[]
  undo: (currentScene: SceneRoot) => HistoryEntry | null
  redo: (currentScene: SceneRoot) => HistoryEntry | null
  clear: () => HistoryEntry[]
  seed: (scene: SceneRoot, description?: string) => HistoryEntry[]
  setApplying: (value: boolean) => boolean
  canUndo: () => boolean
  canRedo: () => boolean
}

type SetState = StoreApi<HistoryState>['setState']
type GetState = StoreApi<HistoryState>['getState']

type HistoryStoreInitialState = Partial<HistoryState> & {
  persistKey?: string
}

const record = (
  set: SetState,
  get: GetState,
  scene: SceneRoot,
  description?: string,
) => {
  if (get().applying) {
    return get().past
  }
  const nextValue = produce<HistoryState>((state) => {
    state.past.push({
      scene: cloneScene(scene),
      description,
      timestamp: Date.now(),
    })
    state.future = []

    if (state.past.length > state.capacity) {
      state.past.shift()
    }
  })

  set(nextValue)
  return get().past
}

const cloneEntry = (entry: HistoryEntry): HistoryEntry => ({
  ...entry,
  scene: cloneScene(entry.scene),
})

const undo = (set: SetState, get: GetState, _currentScene: SceneRoot) => {
  const {past, future} = get()
  if (past.length <= 1) {
    return null
  }
  const current = past[past.length - 1]
  const previous = past[past.length - 2]
  if (!current || !previous) {
    return null
  }

  set({
    past: past.slice(0, -1),
    future: [...future, current],
  })

  return cloneEntry(previous)
}

const redo = (set: SetState, get: GetState, _currentScene: SceneRoot) => {
  const {past, future} = get()
  const nextEntry = future[future.length - 1]
  if (!nextEntry) {
    return null
  }

  set({
    past: [...past, nextEntry],
    future: future.slice(0, -1),
  })

  return cloneEntry(nextEntry)
}

const clear = (set: SetState, get: GetState) => {
  const nextValue = produce<HistoryState>((state) => {
    state.past = []
    state.future = []
  })

  set(nextValue)
  return get().past
}

const seed = (
  set: SetState,
  get: GetState,
  scene: SceneRoot,
  description?: string,
) => {
  const nextValue = produce<HistoryState>((state) => {
    state.past = [
      {scene: cloneScene(scene), description, timestamp: Date.now()},
    ]
    state.future = []
  })

  set(nextValue)
  return get().past
}

const setApplying = (set: SetState, get: GetState, value: boolean) => {
  const nextValue = produce<HistoryState>((state) => {
    state.applying = value
  })

  set(nextValue)
  return get().applying
}

const canUndo = (get: GetState) => get().past.length > 1
const canRedo = (get: GetState) => get().future.length > 0

const createHistoryStore: (
  initialValues: HistoryStoreInitialState,
) => StateCreator<HistoryState, any, any> = (initialValues) => {
  const {persistKey: _persistKey, ...restInitialValues} = initialValues
  const persistKey = initialValues.persistKey ?? 'vision-simulator:history'

  return persist(
    (set, get) => ({
      past: restInitialValues?.past ?? [],
      future: restInitialValues?.future ?? [],
      capacity: restInitialValues?.capacity ?? DEFAULT_HISTORY_CAPACITY,
      applying: false,
      record: (scene, description) => record(set, get, scene, description),
      undo: (currentScene) => undo(set, get, currentScene),
      redo: (currentScene) => redo(set, get, currentScene),
      clear: () => clear(set, get),
      seed: (scene, description) => seed(set, get, scene, description),
      setApplying: (value) => setApplying(set, get, value),
      canUndo: () => canUndo(get),
      canRedo: () => canRedo(get),
      ...restInitialValues,
    }),
    {
      name: persistKey,
      storage: jsonLocalStorage,
      version: 1,
      partialize: (state) => ({
        past: state.past.slice(-Math.min(state.capacity, 20)),
        future: [],
        capacity: state.capacity,
        applying: false,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<HistoryState> | undefined
        return {
          ...current,
          ...persistedState,
          applying: false,
        } as HistoryState
      },
    },
  )
}

export const {
  Provider: HistoryStoreProvider,
  useStore: useHistoryStore,
  getState: getHistoryStore,
} = createZustandContextStore<HistoryState, HistoryStoreInitialState>(
  createHistoryStore,
)
