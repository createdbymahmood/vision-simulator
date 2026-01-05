import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'

import type {SceneRoot} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'

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

  record: (scene: SceneRoot, description?: string) => HistoryEntry[]
  undo: (currentScene: SceneRoot) => HistoryEntry | null
  redo: (currentScene: SceneRoot) => HistoryEntry | null
  clear: () => HistoryEntry[]
  canUndo: () => boolean
  canRedo: () => boolean
}

type SetState = StoreApi<HistoryState>['setState']
type GetState = StoreApi<HistoryState>['getState']

const record = (
  set: SetState,
  get: GetState,
  scene: SceneRoot,
  description?: string,
) => {
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

const undo = (set: SetState, _get: GetState, currentScene: SceneRoot) => {
  let entry: HistoryEntry | null = null

  const nextValue = produce<HistoryState>((state) => {
    const last = state.past.pop()
    if (!last) {
      return
    }

    state.future.push({scene: cloneScene(currentScene), timestamp: Date.now()})
    entry = last
  })

  set(nextValue)
  return entry
}

const redo = (set: SetState, _get: GetState, currentScene: SceneRoot) => {
  let entry: HistoryEntry | null = null

  const nextValue = produce<HistoryState>((state) => {
    const nextEntry = state.future.pop()
    if (!nextEntry) {
      return
    }

    state.past.push({scene: cloneScene(currentScene), timestamp: Date.now()})
    entry = nextEntry
  })

  set(nextValue)
  return entry
}

const clear = (set: SetState, get: GetState) => {
  const nextValue = produce<HistoryState>((state) => {
    state.past = []
    state.future = []
  })

  set(nextValue)
  return get().past
}

const canUndo = (get: GetState) => get().past.length > 0
const canRedo = (get: GetState) => get().future.length > 0

const createHistoryStore: (
  initialValues: Partial<HistoryState>,
) => StateCreator<HistoryState> = (initialValues) => (set, get) => ({
  past: initialValues?.past ?? [],
  future: initialValues?.future ?? [],
  capacity: initialValues?.capacity ?? DEFAULT_HISTORY_CAPACITY,
  record: (scene, description) => record(set, get, scene, description),
  undo: (currentScene) => undo(set, get, currentScene),
  redo: (currentScene) => redo(set, get, currentScene),
  clear: () => clear(set, get),
  canUndo: () => canUndo(get),
  canRedo: () => canRedo(get),
  ...initialValues,
})

export const {
  Provider: HistoryStoreProvider,
  useStore: useHistoryStore,
  getState: getHistoryStore,
} = createZustandContextStore<HistoryState, Partial<HistoryState>>(
  createHistoryStore,
)
