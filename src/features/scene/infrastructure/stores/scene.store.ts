import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'
import React from 'react'

import type {SceneMode, SceneRoot} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'
import {createInitialScene} from '@/features/scene/domain/services/scene-factory'

export interface SceneState {
  scene: SceneRoot
  selectedEntityIds: string[]

  setScene: (scene: SceneRoot) => SceneRoot
  updateScene: (updater: (scene: SceneRoot) => void) => SceneRoot
  setMode: (mode: SceneMode) => SceneRoot
  setMapVisibility: (visible: boolean) => SceneRoot
  setSimulationSeed: (seed: number) => SceneRoot
  setSelection: (ids: string[]) => string[]
  clearSelection: () => string[]
}

type SetState = StoreApi<SceneState>['setState']
type GetState = StoreApi<SceneState>['getState']

const setScene = (set: SetState, get: GetState, scene: SceneRoot) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene = scene
  })

  set(nextValue)
  return get().scene
}

const updateScene = (
  set: SetState,
  get: GetState,
  updater: (scene: SceneRoot) => void,
) => {
  const nextValue = produce<SceneState>((state) => {
    updater(state.scene)
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  return get().scene
}

const setMode = (set: SetState, get: GetState, mode: SceneMode) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.mode = mode
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  return get().scene
}

const setMapVisibility = (set: SetState, get: GetState, visible: boolean) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.mapVisible = visible
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  return get().scene
}

const setSimulationSeed = (set: SetState, get: GetState, seed: number) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.simulationSeed = seed
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  return get().scene
}

const setSelection = (set: SetState, get: GetState, ids: string[]) => {
  const nextValue = produce<SceneState>((state) => {
    state.selectedEntityIds = ids
  })

  set(nextValue)
  return get().selectedEntityIds
}

const clearSelection = (set: SetState, get: GetState) => {
  const nextValue = produce<SceneState>((state) => {
    state.selectedEntityIds = []
  })

  set(nextValue)
  return get().selectedEntityIds
}

const createSceneStore: (
  initialValues: Partial<SceneState>,
) => StateCreator<SceneState> = (initialValues) => (set, get) => ({
  scene: initialValues?.scene ?? createInitialScene(),
  selectedEntityIds: initialValues?.selectedEntityIds ?? [],
  setScene: (scene) => setScene(set, get, scene),
  updateScene: (updater) => updateScene(set, get, updater),
  setMode: (mode) => setMode(set, get, mode),
  setMapVisibility: (visible) => setMapVisibility(set, get, visible),
  setSimulationSeed: (seed) => setSimulationSeed(set, get, seed),
  setSelection: (ids) => setSelection(set, get, ids),
  clearSelection: () => clearSelection(set, get),
  ...initialValues,
})

export const {
  Provider: SceneStoreProvider,
  useStore: useSceneStore,
  getState: getSceneStore,
} = createZustandContextStore<SceneState, Partial<SceneState>>(createSceneStore)
