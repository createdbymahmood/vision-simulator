import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'

import type {ViewMode} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'

export type EditorTool =
  | 'draw-area'
  | 'draw-shape'
  | 'draw-wall'
  | 'hand'
  | 'measure'
  | 'place-camera'
  | 'place-person'
  | 'select'

export interface UiState {
  viewMode: ViewMode
  activeTool: EditorTool
  isEditMode: boolean
  openPanels: Record<string, boolean>
  openPopovers: Record<string, boolean>

  setViewMode: (mode: ViewMode) => ViewMode
  toggleViewMode: () => ViewMode
  setActiveTool: (tool: EditorTool) => EditorTool
  setEditMode: (enabled: boolean) => boolean
  toggleEditMode: () => boolean
  openPanel: (panel: string) => Record<string, boolean>
  closePanel: (panel: string) => Record<string, boolean>
  togglePanel: (panel: string) => Record<string, boolean>
  setPopoverState: (
    popoverId: string,
    isOpen: boolean,
  ) => Record<string, boolean>
  closeAllPanels: () => Record<string, boolean>
  closeAllPopovers: () => Record<string, boolean>
  resetUi: () => UiState
}

type SetState = StoreApi<UiState>['setState']
type GetState = StoreApi<UiState>['getState']

const setViewMode = (set: SetState, get: GetState, mode: ViewMode) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = mode
  })

  set(nextValue)
  return get().viewMode
}

const toggleViewMode = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = state.viewMode === 'editor' ? 'preview' : 'editor'
  })

  set(nextValue)
  return get().viewMode
}

const setActiveTool = (set: SetState, get: GetState, tool: EditorTool) => {
  const nextValue = produce<UiState>((state) => {
    state.activeTool = tool
  })

  set(nextValue)
  return get().activeTool
}

const setEditMode = (set: SetState, get: GetState, enabled: boolean) => {
  const nextValue = produce<UiState>((state) => {
    state.isEditMode = enabled
    if (!enabled) {
      state.activeTool = 'select'
    }
  })

  set(nextValue)
  return get().isEditMode
}

const toggleEditMode = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.isEditMode = !state.isEditMode
    if (!state.isEditMode) {
      state.activeTool = 'select'
    }
  })

  set(nextValue)
  return get().isEditMode
}

const openPanel = (set: SetState, get: GetState, panel: string) => {
  const nextValue = produce<UiState>((state) => {
    state.openPanels[panel] = true
  })

  set(nextValue)
  return get().openPanels
}

const closePanel = (set: SetState, get: GetState, panel: string) => {
  const nextValue = produce<UiState>((state) => {
    state.openPanels[panel] = false
  })

  set(nextValue)
  return get().openPanels
}

const togglePanel = (set: SetState, get: GetState, panel: string) => {
  const nextValue = produce<UiState>((state) => {
    const isOpen = state.openPanels[panel]
    state.openPanels[panel] = !isOpen
  })

  set(nextValue)
  return get().openPanels
}

const setPopoverState = (
  set: SetState,
  get: GetState,
  popoverId: string,
  isOpen: boolean,
) => {
  const nextValue = produce<UiState>((state) => {
    state.openPopovers[popoverId] = isOpen
  })

  set(nextValue)
  return get().openPopovers
}

const closeAllPanels = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.openPanels = {}
  })

  set(nextValue)
  return get().openPanels
}

const closeAllPopovers = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.openPopovers = {}
  })

  set(nextValue)
  return get().openPopovers
}

const resetUi = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = 'editor'
    state.activeTool = 'select'
    state.isEditMode = true
    state.openPanels = {}
    state.openPopovers = {}
  })

  set(nextValue)
  return get()
}

const createUiStore: (
  initialValues: Partial<UiState>,
) => StateCreator<UiState> = (initialValues) => (set, get) => ({
  viewMode: initialValues?.viewMode ?? 'editor',
  activeTool: initialValues?.activeTool ?? 'select',
  isEditMode: initialValues?.isEditMode ?? true,
  openPanels: initialValues?.openPanels ?? {},
  openPopovers: initialValues?.openPopovers ?? {},
  setViewMode: (mode) => setViewMode(set, get, mode),
  toggleViewMode: () => toggleViewMode(set, get),
  setActiveTool: (tool) => setActiveTool(set, get, tool),
  setEditMode: (enabled) => setEditMode(set, get, enabled),
  toggleEditMode: () => toggleEditMode(set, get),
  openPanel: (panel) => openPanel(set, get, panel),
  closePanel: (panel) => closePanel(set, get, panel),
  togglePanel: (panel) => togglePanel(set, get, panel),
  setPopoverState: (popoverId, isOpen) =>
    setPopoverState(set, get, popoverId, isOpen),
  closeAllPanels: () => closeAllPanels(set, get),
  closeAllPopovers: () => closeAllPopovers(set, get),
  resetUi: () => resetUi(set, get),
  ...initialValues,
})

export const {
  Provider: UiStoreProvider,
  useStore: useUiStore,
  getState: getUiStore,
} = createZustandContextStore<UiState, Partial<UiState>>(createUiStore)
