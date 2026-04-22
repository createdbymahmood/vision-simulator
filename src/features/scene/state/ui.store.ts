import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'
import {persist} from 'zustand/middleware'

import type {
  CameraPlacementProfile,
  PreviewViewMode,
  SimulationViewMode,
  ViewMode,
} from '@/features/scene/types/types'

import {createZustandContextStore} from '@/components/shared/zustand'
import {jsonLocalStorage} from '@/lib/zustand-persist'

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

export interface LiveRadarCameraIntrinsicsState {
  cx?: number
  cy?: number
  fx?: number
  fy?: number
  hfov_deg?: number
  image_height: number
  image_width: number
  vfov_deg?: number
}

export interface LiveRadarCameraState {
  camera_lat: number
  camera_lon: number
  camera_height_m: number
  yaw_deg: number
  pitch_deg: number
  roll_deg: number
  intrinsics: LiveRadarCameraIntrinsicsState
}

export interface LiveRadarDetectionState {
  id: string
  trackerId: string
  cameraId: string
  lat: number
  lon: number
  className: string
  confidence?: number
  ts?: number
}

export interface LiveRadarTrackerUpdateState {
  id: string
  trackerId: string
  cameraId: string
  className: string
  confidence?: number
  lat?: number
  lon?: number
  distance?: number
  timestampLabel: string
  timestampValue?: number
}

export interface LiveRadarState {
  cameraStatesById: Record<string, LiveRadarCameraState>
  detectionsById: Record<string, LiveRadarDetectionState>
  updatesByTracker: Record<string, LiveRadarTrackerUpdateState>
  updatedAt: number
}

export interface UiState {
  viewMode: ViewMode
  previewViewMode: PreviewViewMode
  simulationViewMode: SimulationViewMode
  activeTool: EditorTool
  isEditMode: boolean
  openPanels: Record<string, boolean>
  openPopovers: Record<string, boolean>
  accessToken?: string
  apiWsServiceUrl?: string
  mediaMtxUrl?: string
  mapboxToken?: string
  cameraPlacement: {
    profile: CameraPlacementProfile | null
    color: string | null
  }
  flyToActiveAreaTick: number
  radarSettings: RadarSettings
  visionState: VisionState
  liveRadarState: LiveRadarState

  setViewMode: (mode: ViewMode) => ViewMode
  toggleViewMode: () => ViewMode
  setPreviewViewMode: (mode: PreviewViewMode) => PreviewViewMode
  togglePreviewViewMode: () => PreviewViewMode
  setSimulationViewMode: (mode: SimulationViewMode) => SimulationViewMode
  toggleSimulationViewMode: () => SimulationViewMode
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
  setLiveRadarCameraState: (
    cameraId: string,
    cameraState: LiveRadarCameraState,
  ) => LiveRadarState
  setLiveRadarDetectionState: (
    detectionId: string,
    detectionState: LiveRadarDetectionState,
  ) => LiveRadarState
  removeLiveRadarDetectionState: (detectionId: string) => LiveRadarState
  setLiveRadarUpdatesByTracker: (
    updatesByTracker: Record<string, LiveRadarTrackerUpdateState>,
  ) => LiveRadarState
  clearLiveRadarState: () => LiveRadarState
  resetUi: () => UiState
}

type SetState = StoreApi<UiState>['setState']
type GetState = StoreApi<UiState>['getState']

export type UiStoreInitialState = Partial<UiState> & {
  persistKey?: string
}

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

const setSimulationViewMode = (
  set: SetState,
  get: GetState,
  mode: SimulationViewMode,
) => {
  const nextValue = produce<UiState>((state) => {
    state.simulationViewMode = mode
  })

  set(nextValue)
  return get().simulationViewMode
}

const toggleSimulationViewMode = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.simulationViewMode =
      state.simulationViewMode === 'scene' ? 'cameraGrid' : 'scene'
  })

  set(nextValue)
  return get().simulationViewMode
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

const setLiveRadarCameraState = (
  set: SetState,
  get: GetState,
  cameraId: string,
  cameraState: LiveRadarCameraState,
) => {
  const nextValue = produce<UiState>((state) => {
    state.liveRadarState.cameraStatesById[cameraId] = cameraState
    state.liveRadarState.updatedAt = Date.now()
  })

  set(nextValue)
  return get().liveRadarState
}

const setLiveRadarDetectionState = (
  set: SetState,
  get: GetState,
  detectionId: string,
  detectionState: LiveRadarDetectionState,
) => {
  const nextValue = produce<UiState>((state) => {
    state.liveRadarState.detectionsById[detectionId] = detectionState
    state.liveRadarState.updatedAt = Date.now()
  })

  set(nextValue)
  return get().liveRadarState
}

const removeLiveRadarDetectionState = (
  set: SetState,
  get: GetState,
  detectionId: string,
) => {
  const nextValue = produce<UiState>((state) => {
    if (!state.liveRadarState.detectionsById[detectionId]) {
      return
    }
    const {[detectionId]: removed, ...next} =
      state.liveRadarState.detectionsById
    void removed
    state.liveRadarState.detectionsById = next
    state.liveRadarState.updatedAt = Date.now()
  })

  set(nextValue)
  return get().liveRadarState
}

const setLiveRadarUpdatesByTracker = (
  set: SetState,
  get: GetState,
  updatesByTracker: Record<string, LiveRadarTrackerUpdateState>,
) => {
  const nextValue = produce<UiState>((state) => {
    state.liveRadarState.updatesByTracker = updatesByTracker
    state.liveRadarState.updatedAt = Date.now()
  })

  set(nextValue)
  return get().liveRadarState
}

const clearLiveRadarState = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.liveRadarState = {
      cameraStatesById: {},
      detectionsById: {},
      updatesByTracker: {},
      updatedAt: 0,
    }
  })

  set(nextValue)
  return get().liveRadarState
}

const resetUi = (set: SetState, get: GetState) => {
  const nextValue = produce<UiState>((state) => {
    state.viewMode = 'editor'
    state.previewViewMode = '3d'
    state.simulationViewMode = 'scene'
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
    state.liveRadarState = {
      cameraStatesById: {},
      detectionsById: {},
      updatesByTracker: {},
      updatedAt: 0,
    }
  })

  set(nextValue)
  return get()
}

const defaultUiState = {
  viewMode: 'editor' as ViewMode,
  previewViewMode: '3d' as PreviewViewMode,
  simulationViewMode: 'scene' as SimulationViewMode,
  activeTool: 'select' as EditorTool,
  isEditMode: true,
  openPanels: {} as Record<string, boolean>,
  openPopovers: {} as Record<string, boolean>,
  accessToken: undefined as string | undefined,
  apiWsServiceUrl: undefined as string | undefined,
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
  liveRadarState: {
    cameraStatesById: {},
    detectionsById: {},
    updatesByTracker: {},
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
  liveRadarState: {
    ...defaultUiState.liveRadarState,
    ...initialValues.liveRadarState,
    cameraStatesById: {
      ...defaultUiState.liveRadarState.cameraStatesById,
      ...initialValues.liveRadarState?.cameraStatesById,
    },
    detectionsById: {
      ...defaultUiState.liveRadarState.detectionsById,
      ...initialValues.liveRadarState?.detectionsById,
    },
    updatesByTracker: {
      ...defaultUiState.liveRadarState.updatesByTracker,
      ...initialValues.liveRadarState?.updatesByTracker,
    },
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
  initialValues: UiStoreInitialState,
) => StateCreator<UiState, any, any> = (initialValues) => {
  const {persistKey: _persistKey, ...restInitialValues} = initialValues
  const persistKey = initialValues.persistKey ?? 'vision-simulator:ui'

  return persist(
    (set, get) => ({
      ...mergeUiState(restInitialValues),
      setViewMode: (mode) => setViewMode(set, get, mode),
      toggleViewMode: () => toggleViewMode(set, get),
      setPreviewViewMode: (mode) => setPreviewViewMode(set, get, mode),
      togglePreviewViewMode: () => togglePreviewViewMode(set, get),
      setSimulationViewMode: (mode) => setSimulationViewMode(set, get, mode),
      toggleSimulationViewMode: () => toggleSimulationViewMode(set, get),
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
      setLiveRadarCameraState: (cameraId, cameraState) =>
        setLiveRadarCameraState(set, get, cameraId, cameraState),
      setLiveRadarDetectionState: (detectionId, detectionState) =>
        setLiveRadarDetectionState(set, get, detectionId, detectionState),
      removeLiveRadarDetectionState: (detectionId) =>
        removeLiveRadarDetectionState(set, get, detectionId),
      setLiveRadarUpdatesByTracker: (updatesByTracker) =>
        setLiveRadarUpdatesByTracker(set, get, updatesByTracker),
      clearLiveRadarState: () => clearLiveRadarState(set, get),
      resetUi: () => resetUi(set, get),
    }),
    {
      name: persistKey,
      storage: jsonLocalStorage,
      version: 1,
      partialize: (state) => ({
        viewMode: state.viewMode,
        previewViewMode: state.previewViewMode,
        simulationViewMode: state.simulationViewMode,
        activeTool: state.activeTool,
        isEditMode: state.isEditMode,
        openPanels: state.openPanels,
        openPopovers: state.openPopovers,
        mapboxToken: state.mapboxToken,
        cameraPlacement: state.cameraPlacement,
        radarSettings: state.radarSettings,
      }),
    },
  )
}

export const {
  Provider: UiStoreProvider,
  useStore: useUiStore,
  getState: getUiStore,
} = createZustandContextStore<UiState, UiStoreInitialState>(createUiStore)
