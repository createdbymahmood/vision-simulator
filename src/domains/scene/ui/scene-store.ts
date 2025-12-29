import type {StateCreator} from 'zustand'

/* eslint-disable max-lines-per-function */
import {produce} from 'immer'

import {createZustandContextStore} from '@/components/shared/zustand'

import type {
  Scene,
  SceneArea,
  SceneBackground,
  SceneCamera,
  SceneEntityKind,
  SceneMode,
  ScenePerson,
  SceneSelection,
  SceneShape,
  SceneTool,
  SceneWall,
} from '../core/scene-types'

import {
  createDefaultScene,
  createInitialSelection,
} from '../core/scene-defaults'

type AutosaveStatus = 'idle' | 'saving'

export interface SceneStoreState {
  scene: Scene
  selection: SceneSelection
  activeTool: SceneTool
  overlays: {
    isPropertiesOpen: boolean
    isCommandPaletteOpen: boolean
    activePopover: string | null
  }
  autosave: {
    lastSavedAt: number | null
    status: AutosaveStatus
  }
}

export interface SceneStoreActions {
  setActiveTool: (tool: SceneTool) => void
  selectEntity: (payload: {id: string; kind: SceneEntityKind} | null) => void
  toggleSelectionMode: () => void
  closeOverlays: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setActivePopover: (popover: string | null) => void
  setSceneMode: (mode: SceneMode) => void
  setSceneBackground: (background: SceneBackground | undefined) => void
  hydrateScene: (scene: Scene) => void
  resetScene: () => void
  markSceneSaved: (timestamp: number) => void
  setAutosaveStatus: (status: AutosaveStatus) => void
  addWall: (wall: SceneWall) => void
  updateWall: (id: string, patch: Partial<Omit<SceneWall, 'id'>>) => void
  removeWall: (id: string) => void
  addShape: (shape: SceneShape) => void
  updateShape: (id: string, patch: Partial<Omit<SceneShape, 'id'>>) => void
  removeShape: (id: string) => void
  addCamera: (camera: SceneCamera) => void
  updateCamera: (id: string, patch: Partial<Omit<SceneCamera, 'id'>>) => void
  removeCamera: (id: string) => void
  addPerson: (person: ScenePerson) => void
  updatePerson: (id: string, patch: Partial<Omit<ScenePerson, 'id'>>) => void
  removePerson: (id: string) => void
  addArea: (area: SceneArea) => void
  updateArea: (id: string, patch: Partial<Omit<SceneArea, 'id'>>) => void
  removeArea: (id: string) => void
}

export type SceneStore = SceneStoreActions & SceneStoreState

export interface SceneStoreInitialState {
  scene?: Scene
  selection?: SceneSelection
  activeTool?: SceneTool
}

type Mutator = (recipe: (draft: SceneStore) => void) => void

function createMutator(set: Parameters<StateCreator<SceneStore>>[0]): Mutator {
  return (recipe) => set(produce(recipe))
}

function touchUpdatedAt(state: SceneStore): void {
  state.scene.meta.updatedAt = Date.now()
}

function removeEntityById<T extends {id: string}>(
  collection: T[],
  id: string,
): void {
  const index = collection.findIndex((item) => item.id === id)
  if (index !== -1) {
    collection.splice(index, 1)
  }
}

function patchEntity<T extends {id: string}>(
  collection: T[],
  id: string,
  patch: Partial<Omit<T, 'id'>>,
): void {
  const index = collection.findIndex((item) => item.id === id)
  if (index !== -1) {
    collection[index] = {...collection[index], ...patch} as T
  }
}

const createSceneStore: (
  initial: SceneStoreInitialState,
) => StateCreator<SceneStore> = (initial) => (set) => {
  const mutate = createMutator(set)

  return {
    scene: initial.scene ?? createDefaultScene(),
    selection: initial.selection ?? createInitialSelection(),
    activeTool: initial.activeTool ?? 'select',
    overlays: {
      isPropertiesOpen: false,
      isCommandPaletteOpen: false,
      activePopover: null,
    },
    autosave: {
      lastSavedAt: null,
      status: 'idle',
    },
    setActiveTool: (tool) =>
      mutate((state) => {
        state.activeTool = tool
        state.selection = createInitialSelection()
        state.overlays.isPropertiesOpen = false
        state.overlays.activePopover = null
        state.overlays.isCommandPaletteOpen = false
      }),
    selectEntity: (payload) =>
      mutate((state) => {
        state.selection.selectedEntityId = payload?.id ?? null
        state.selection.selectedEntityKind = payload?.kind ?? null
        state.overlays.isPropertiesOpen = Boolean(payload)
      }),
    toggleSelectionMode: () =>
      mutate((state) => {
        state.selection.mode =
          state.selection.mode === 'single' ? 'multi' : 'single'
      }),
    closeOverlays: () =>
      mutate((state) => {
        state.overlays.isPropertiesOpen = false
        state.overlays.isCommandPaletteOpen = false
        state.overlays.activePopover = null
      }),
    setCommandPaletteOpen: (open) =>
      mutate((state) => {
        state.overlays.isCommandPaletteOpen = open
        if (!open) {
          state.overlays.activePopover = null
        }
      }),
    setActivePopover: (popover) =>
      mutate((state) => {
        state.overlays.activePopover = popover
      }),
    setSceneMode: (mode) =>
      mutate((state) => {
        state.scene.mode = mode
        touchUpdatedAt(state)
      }),
    setSceneBackground: (background) =>
      mutate((state) => {
        state.scene.background = background
        touchUpdatedAt(state)
      }),
    hydrateScene: (scene) =>
      mutate((state) => {
        state.scene = scene
        state.selection = createInitialSelection()
        state.overlays.isPropertiesOpen = false
        state.overlays.isCommandPaletteOpen = false
        state.overlays.activePopover = null
      }),
    resetScene: () =>
      mutate((state) => {
        state.scene = createDefaultScene()
        state.selection = createInitialSelection()
        state.activeTool = 'select'
        state.overlays.isPropertiesOpen = false
        state.overlays.isCommandPaletteOpen = false
        state.overlays.activePopover = null
        state.autosave.status = 'idle'
      }),
    markSceneSaved: (timestamp) =>
      mutate((state) => {
        state.autosave.lastSavedAt = timestamp
        state.autosave.status = 'idle'
      }),
    setAutosaveStatus: (status) =>
      mutate((state) => {
        state.autosave.status = status
      }),
    addWall: (wall) =>
      mutate((state) => {
        state.scene.walls.push(wall)
        touchUpdatedAt(state)
      }),
    updateWall: (id, patch) =>
      mutate((state) => {
        patchEntity(state.scene.walls, id, patch)
        touchUpdatedAt(state)
      }),
    removeWall: (id) =>
      mutate((state) => {
        removeEntityById(state.scene.walls, id)
        if (state.selection.selectedEntityId === id) {
          state.selection = createInitialSelection()
          state.overlays.isPropertiesOpen = false
        }
        touchUpdatedAt(state)
      }),
    addShape: (shape) =>
      mutate((state) => {
        state.scene.shapes.push(shape)
        touchUpdatedAt(state)
      }),
    updateShape: (id, patch) =>
      mutate((state) => {
        patchEntity(state.scene.shapes, id, patch)
        touchUpdatedAt(state)
      }),
    removeShape: (id) =>
      mutate((state) => {
        removeEntityById(state.scene.shapes, id)
        if (state.selection.selectedEntityId === id) {
          state.selection = createInitialSelection()
          state.overlays.isPropertiesOpen = false
        }
        touchUpdatedAt(state)
      }),
    addCamera: (camera) =>
      mutate((state) => {
        state.scene.cameras.push(camera)
        touchUpdatedAt(state)
      }),
    updateCamera: (id, patch) =>
      mutate((state) => {
        patchEntity(state.scene.cameras, id, patch)
        touchUpdatedAt(state)
      }),
    removeCamera: (id) =>
      mutate((state) => {
        removeEntityById(state.scene.cameras, id)
        if (state.selection.selectedEntityId === id) {
          state.selection = createInitialSelection()
          state.overlays.isPropertiesOpen = false
        }
        touchUpdatedAt(state)
      }),
    addPerson: (person) =>
      mutate((state) => {
        state.scene.people.push(person)
        touchUpdatedAt(state)
      }),
    updatePerson: (id, patch) =>
      mutate((state) => {
        patchEntity(state.scene.people, id, patch)
        touchUpdatedAt(state)
      }),
    removePerson: (id) =>
      mutate((state) => {
        removeEntityById(state.scene.people, id)
        if (state.selection.selectedEntityId === id) {
          state.selection = createInitialSelection()
          state.overlays.isPropertiesOpen = false
        }
        touchUpdatedAt(state)
      }),
    addArea: (area) =>
      mutate((state) => {
        state.scene.areas.push(area)
        touchUpdatedAt(state)
      }),
    updateArea: (id, patch) =>
      mutate((state) => {
        patchEntity(state.scene.areas, id, patch)
        touchUpdatedAt(state)
      }),
    removeArea: (id) =>
      mutate((state) => {
        removeEntityById(state.scene.areas, id)
        if (state.selection.selectedEntityId === id) {
          state.selection = createInitialSelection()
          state.overlays.isPropertiesOpen = false
        }
        touchUpdatedAt(state)
      }),
  }
}

export const sceneStore = createZustandContextStore<
  SceneStore,
  SceneStoreInitialState
>(createSceneStore)

export const useSceneStore = sceneStore.useStore
