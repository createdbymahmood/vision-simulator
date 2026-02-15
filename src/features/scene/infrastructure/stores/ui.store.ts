import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'

import type {
  CameraPlacementProfile,
  PreviewViewMode,
  ViewMode,
} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'

export type EditorTool =
  | 'draw-area'
  | 'draw-shape'
  | 'draw-wall'
  | 'hand'
  | 'place-camera'
  | 'place-person'
  | 'select'

export interface RadarSettings {
  zoom: number
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
  previewViewMode: PreviewViewMode
  activeTool: EditorTool
  isEditMode: boolean
  openPanels: Record<string, boolean>
  openPopovers: Record<string, boolean>
  accessToken?: string
  mediaMtxUrl?: string
  mapboxToken?: string
  cameraPlacement: {
    profile: CameraPlacementProfile | null
    color: string | null
  }
  flyToActiveAreaTick: number
  radarSettings: RadarSettings
  visionState: VisionState

  setViewMode: (mode: ViewMode) => ViewMode
  toggleViewMode: () => ViewMode
  setPreviewViewMode: (mode: PreviewViewMode) => PreviewViewMode
  togglePreviewViewMode: () => PreviewViewMode
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
    profile: CameraPlacementProfile | null,
    color: string | null,
  ) => {
    profile: CameraPlacementProfile | null
    color: string | null
  }
  clearCameraPlacement: () => {
    profile: CameraPlacementProfile | null
    color: string | null
  }
  triggerFlyToActiveArea: () => number
  setRadarSettings: (settings: Partial<RadarSettings>) => RadarSettings
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

const setPreviewViewMode = (
  set: SetState,
  get: GetState,
  mode: PreviewViewMode,
) => {
  const nextValue = produce<UiState>((state) => {
    state.previewViewMode = mode
  })

  set(nextValue)
  return get().previewViewMode
}

const togglePreviewViewMode = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.previewViewMode = state.previewViewMode === '3d' ? '2d' : '3d'
  })

  set(nextValue)
  return get().previewViewMode
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
      state.activeTool = 'hand'
    }
  })

  set(nextValue)
  return get().isEditMode
}

const toggleEditMode = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.isEditMode = !state.isEditMode
    if (!state.isEditMode) {
      state.activeTool = 'hand'
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

const setVisionState = (set: SetState, get: GetState, state: VisionState) => {
  const nextValue = produce<UiState>((draft) => {
    draft.visionState = state
  })

  set(nextValue)
  return get().visionState
}

const resetUi = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = 'editor'
    state.previewViewMode = '3d'
    state.activeTool = 'select'
    state.isEditMode = true
    state.openPanels = {}
    state.openPopovers = {}
    state.cameraPlacement = {profile: null, color: null}
    state.flyToActiveAreaTick = 0
    state.radarSettings = {
      zoom: 1.1,
      pan: {x: 0, y: 0},
    }
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

const defaultUiState = {
  viewMode: 'editor' as ViewMode,
  previewViewMode: '3d' as PreviewViewMode,
  activeTool: 'select' as EditorTool,
  isEditMode: true,
  openPanels: {} as Record<string, boolean>,
  openPopovers: {} as Record<string, boolean>,
  accessToken: undefined as string | undefined,
  mediaMtxUrl: undefined as string | undefined,
  mapboxToken: undefined as string | undefined,
  cameraPlacement: {
    profile: null,
    color: null,
  },
  flyToActiveAreaTick: 0,
  radarSettings: {
    zoom: 1.1,
    pan: {x: 0, y: 0},
  },
  visionState: {
    peopleWorld: {},
    visibleByCameraId: {},
    detectionsCount: 0,
    updatedAt: 0,
  },
}

const mergeUiState = (initialValues: Partial<UiState>) => ({
  ...defaultUiState,
  ...initialValues,
  cameraPlacement: {
    ...defaultUiState.cameraPlacement,
    ...initialValues.cameraPlacement,
  },
  radarSettings: {
    ...defaultUiState.radarSettings,
    ...initialValues.radarSettings,
  },
  visionState: {
    ...defaultUiState.visionState,
    ...initialValues.visionState,
  },
})

const triggerFlyToActiveArea = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.flyToActiveAreaTick += 1
  })

  set(nextValue)
  return get().flyToActiveAreaTick
}

const createUiStore: (
  initialValues: Partial<UiState>,
) => StateCreator<UiState> = (initialValues) => (set, get) => ({
  ...mergeUiState(initialValues),
  setViewMode: (mode) => setViewMode(set, get, mode),
  toggleViewMode: () => toggleViewMode(set, get),
  setPreviewViewMode: (mode) => setPreviewViewMode(set, get, mode),
  togglePreviewViewMode: () => togglePreviewViewMode(set, get),
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
  setCameraPlacement: (profile, color) => {
    const nextValue = produce<UiState>((state) => {
      state.cameraPlacement = {profile, color}
    })
    set(nextValue)
    return get().cameraPlacement
  },
  clearCameraPlacement: () => {
    const nextValue = produce<UiState>((state) => {
      state.cameraPlacement = {profile: null, color: null}
    })
    set(nextValue)
    return get().cameraPlacement
  },
  triggerFlyToActiveArea: () => triggerFlyToActiveArea(set, get),
  setRadarSettings: (settings) => setRadarSettings(set, get, settings),
  setVisionState: (state) => setVisionState(set, get, state),
  resetUi: () => resetUi(set, get),
})

export const {
  Provider: UiStoreProvider,
  useStore: useUiStore,
  getState: getUiStore,
} = createZustandContextStore<UiState, Partial<UiState>>(createUiStore)
