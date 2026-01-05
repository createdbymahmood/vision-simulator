import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'

import type {
  PolygonGeometry,
  SceneMode,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'
import {createDefaultShape} from '@/features/scene/domain/constants/shape-style'
import {createDefaultWall} from '@/features/scene/domain/constants/wall-style'
import {createAreaEntity} from '@/features/scene/domain/services/area-factory'
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
  addArea: (geometry: PolygonGeometry) => SceneRoot
  setActiveArea: (areaId?: string) => SceneRoot
  updateAreaName: (areaId: string, name: string) => SceneRoot
  deleteArea: (areaId: string) => SceneRoot
  addWall: (wall: Omit<WallEntity, 'id'>) => SceneRoot
  addShape: (shape: Omit<ShapeEntity, 'id'>) => SceneRoot
}

type SetState = StoreApi<SceneState>['setState']
type GetState = StoreApi<SceneState>['getState']

const STORAGE_KEY = 'scene-store'

const isBrowser = () => typeof window !== 'undefined'

const loadSceneFromStorage = (): SceneRoot | null => {
  if (!isBrowser()) {
    return null
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as SceneRoot
    return parsed
  } catch (error) {
    console.warn('Failed to parse persisted scene', error)
    return null
  }
}

const persistScene = (scene: SceneRoot) => {
  if (!isBrowser()) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
  } catch (error) {
    console.warn('Failed to persist scene', error)
  }
}

const setScene = (set: SetState, get: GetState, scene: SceneRoot) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene = scene
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
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
  const updated = get().scene
  persistScene(updated)
  return updated
}

const setMode = (set: SetState, get: GetState, mode: SceneMode) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.mode = mode
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const setMapVisibility = (set: SetState, get: GetState, visible: boolean) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.mapVisible = visible
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const setSimulationSeed = (set: SetState, get: GetState, seed: number) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.simulationSeed = seed
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
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

const addArea = (set: SetState, get: GetState, geometry: PolygonGeometry) => {
  const nextValue = produce<SceneState>((state) => {
    const area = createAreaEntity(state.scene.areas, geometry)
    state.scene.areas.push(area)
    state.scene.activeAreaId = area.id
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const setActiveArea = (
  set: SetState,
  get: GetState,
  areaId?: string,
): SceneRoot => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.activeAreaId = areaId
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const updateAreaName = (
  set: SetState,
  get: GetState,
  areaId: string,
  name: string,
) => {
  const nextValue = produce<SceneState>((state) => {
    const area = state.scene.areas.find((item) => item.id === areaId)
    if (area) {
      area.name = name
      state.scene.meta.updatedAt = new Date().toISOString()
    }
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const deleteArea = (set: SetState, get: GetState, areaId: string) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.areas = state.scene.areas.filter((area) => area.id !== areaId)
    state.scene.walls = state.scene.walls.filter(
      (wall) => wall.areaId !== areaId,
    )
    state.scene.shapes = state.scene.shapes.filter(
      (shape) => shape.areaId !== areaId,
    )
    state.scene.cameras = state.scene.cameras.filter(
      (camera) => camera.areaId !== areaId,
    )
    state.scene.people = state.scene.people.filter(
      (person) => person.areaId !== areaId,
    )
    state.selectedEntityIds = state.selectedEntityIds.filter(
      (id) =>
        !id.startsWith('wall-') &&
        !id.startsWith('shape-') &&
        !id.startsWith('camera-') &&
        !id.startsWith('person-'),
    )
    if (state.scene.activeAreaId === areaId) {
      state.scene.activeAreaId =
        state.scene.areas.length > 0 ? state.scene.areas[0]?.id : undefined
    }
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const addWall = (
  set: SetState,
  get: GetState,
  wall: Omit<WallEntity, 'id'>,
) => {
  const nextValue = produce<SceneState>((state) => {
    const id = `wall-${state.scene.walls.length + 1}`
    state.scene.walls.push(createDefaultWall(wall.areaId, wall.points, id))
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const addShape = (
  set: SetState,
  get: GetState,
  shape: Omit<ShapeEntity, 'id'>,
) => {
  const nextValue = produce<SceneState>((state) => {
    const id = `shape-${state.scene.shapes.length + 1}`
    state.scene.shapes.push(
      createDefaultShape(
        id,
        shape.areaId,
        shape.shapeType as any,
        shape.geometry,
      ),
    )
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const createSceneStore: (
  initialValues: Partial<SceneState>,
) => StateCreator<SceneState> = (initialValues) => (set, get) => ({
  scene: initialValues?.scene ?? loadSceneFromStorage() ?? createInitialScene(),
  selectedEntityIds: initialValues?.selectedEntityIds ?? [],
  setScene: (scene) => setScene(set, get, scene),
  updateScene: (updater) => updateScene(set, get, updater),
  setMode: (mode) => setMode(set, get, mode),
  setMapVisibility: (visible) => setMapVisibility(set, get, visible),
  setSimulationSeed: (seed) => setSimulationSeed(set, get, seed),
  setSelection: (ids) => setSelection(set, get, ids),
  clearSelection: () => clearSelection(set, get),
  addArea: (geometry) => addArea(set, get, geometry),
  setActiveArea: (areaId) => setActiveArea(set, get, areaId),
  updateAreaName: (areaId, name) => updateAreaName(set, get, areaId, name),
  deleteArea: (areaId) => deleteArea(set, get, areaId),
  addWall: (wall) => addWall(set, get, wall),
  addShape: (shape) => addShape(set, get, shape),
  ...initialValues,
})

export const {
  Provider: SceneStoreProvider,
  useStore: useSceneStore,
  getState: getSceneStore,
} = createZustandContextStore<SceneState, Partial<SceneState>>(createSceneStore)
