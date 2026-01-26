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

export type CameraFeedGrid = '2x2' | '3x3' | '4x4'

export interface RadarSettings {
  isMinimized: boolean
  zoom: number
  position: {x: number; y: number}
  size: {width: number; height: number}
  pan: {x: number; y: number}
}

export interface VisionPersonState {
  x: number
  y: number
  z: number
  height: number
  areaId: string
}

export interface VisionState {
  peopleWorld: Record<string, VisionPersonState>
  visibleByCameraId: Record<string, string[]>
  detectionsCount: number
  updatedAt: number
}

export interface UiState {
  viewMode: ViewMode
  activeTool: EditorTool
  isEditMode: boolean
  openPanels: Record<string, boolean>
  openPopovers: Record<string, boolean>
  cameraPlacement: {
    presetId: string | null
    color: string | null
  }
  flyToActiveAreaTick: number
  activeCameraId?: string
  radarSettings: RadarSettings
  cameraFeedGrid: CameraFeedGrid
  visionState: VisionState

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
  setCameraPlacement: (
    presetId: string | null,
    color: string | null,
  ) => {
    presetId: string | null
    color: string | null
  }
  clearCameraPlacement: () => {
    presetId: string | null
    color: string | null
  }
  triggerFlyToActiveArea: () => number
  setActiveCameraId: (cameraId?: string) => string | undefined
  cycleActiveCamera: (cameraIds: string[]) => string | undefined
  setRadarSettings: (settings: Partial<RadarSettings>) => RadarSettings
  setCameraFeedGrid: (grid: CameraFeedGrid) => CameraFeedGrid
  setVisionState: (state: VisionState) => VisionState
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

const setActiveCameraId = (set: SetState, get: GetState, cameraId?: string) => {
  const nextValue = produce<UiState>((state) => {
    state.activeCameraId = cameraId
  })

  set(nextValue)
  return get().activeCameraId
}

const setRadarSettings = (
  set: SetState,
  get: GetState,
  settings: Partial<RadarSettings>,
) => {
  const nextValue = produce<UiState>((state) => {
    state.radarSettings = {...state.radarSettings, ...settings}
  })

  set(nextValue)
  return get().radarSettings
}

const setCameraFeedGrid = (
  set: SetState,
  get: GetState,
  grid: CameraFeedGrid,
) => {
  const nextValue = produce<UiState>((state) => {
    state.cameraFeedGrid = grid
  })

  set(nextValue)
  return get().cameraFeedGrid
}

const setVisionState = (set: SetState, get: GetState, state: VisionState) => {
  const nextValue = produce<UiState>((draft) => {
    draft.visionState = state
  })

  set(nextValue)
  return get().visionState
}

const cycleActiveCamera = (
  set: SetState,
  get: GetState,
  cameraIds: string[],
) => {
  const nextValue = produce<UiState>((state) => {
    if (cameraIds.length === 0) {
      state.activeCameraId = undefined
      return
    }
    const currentIndex = cameraIds.findIndex(
      (id) => id === state.activeCameraId,
    )
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % cameraIds.length
    state.activeCameraId = cameraIds[nextIndex]
  })

  set(nextValue)
  return get().activeCameraId
}

const resetUi = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = 'editor'
    state.activeTool = 'select'
    state.isEditMode = true
    state.openPanels = {}
    state.openPopovers = {}
    state.cameraPlacement = {presetId: null, color: null}
    state.flyToActiveAreaTick = 0
    state.activeCameraId = undefined
    state.radarSettings = {
      isMinimized: false,
      zoom: 1,
      position: {x: 16, y: 16},
      size: {width: 360, height: 360},
      pan: {x: 0, y: 0},
    }
    state.cameraFeedGrid = '2x2'
    state.visionState = {
      peopleWorld: {},
      visibleByCameraId: {},
      detectionsCount: 0,
      updatedAt: 0,
    }
  })

  set(nextValue)
  return get()
}

const triggerFlyToActiveArea = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.flyToActiveAreaTick += 1
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
  cameraPlacement: initialValues?.cameraPlacement ?? {
    presetId: null,
    color: null,
  },
  flyToActiveAreaTick: initialValues?.flyToActiveAreaTick ?? 0,
  activeCameraId: initialValues?.activeCameraId,
  radarSettings: initialValues?.radarSettings ?? {
    isMinimized: false,
    zoom: 1,
    position: {x: 16, y: 16},
    size: {width: 360, height: 360},
    pan: {x: 0, y: 0},
  },
  cameraFeedGrid: initialValues?.cameraFeedGrid ?? '2x2',
  visionState: initialValues?.visionState ?? {
    peopleWorld: {},
    visibleByCameraId: {},
    detectionsCount: 0,
    updatedAt: 0,
  },
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
  setCameraPlacement: (presetId, color) => {
    const nextValue = produce<UiState>((state) => {
      state.cameraPlacement = {presetId, color}
    })
    set(nextValue)
    return get().cameraPlacement
  },
  clearCameraPlacement: () => {
    const nextValue = produce<UiState>((state) => {
      state.cameraPlacement = {presetId: null, color: null}
    })
    set(nextValue)
    return get().cameraPlacement
  },
  triggerFlyToActiveArea: () => triggerFlyToActiveArea(set, get),
  setActiveCameraId: (cameraId) => setActiveCameraId(set, get, cameraId),
  cycleActiveCamera: (cameraIds) => cycleActiveCamera(set, get, cameraIds),
  setRadarSettings: (settings) => setRadarSettings(set, get, settings),
  setCameraFeedGrid: (grid) => setCameraFeedGrid(set, get, grid),
  setVisionState: (state) => setVisionState(set, get, state),
  resetUi: () => resetUi(set, get),
  ...initialValues,
})

export const {
  Provider: UiStoreProvider,
  useStore: useUiStore,
  getState: getUiStore,
} = createZustandContextStore<UiState, Partial<UiState>>(createUiStore)
