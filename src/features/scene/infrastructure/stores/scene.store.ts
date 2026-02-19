import type {StateCreator, StoreApi} from 'zustand'

import {produce} from 'immer'

import type {
  CameraEntity,
  CameraSourceFeature,
  EditorMode,
  PersonEntity,
  PolygonGeometry,
  SceneMapStyle,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

import {createZustandContextStore} from '@/components/shared/zustand'
import {createDefaultPerson} from '@/features/scene/domain/constants/person-defaults'
import {createDefaultShape} from '@/features/scene/domain/constants/shape-style'
import {createDefaultWall} from '@/features/scene/domain/constants/wall-style'
import {createAreaEntity} from '@/features/scene/domain/services/area-factory'
import {createCameraEntity} from '@/features/scene/domain/services/camera-factory'
import {createDefaultCameraOptics} from '@/features/scene/domain/services/camera-optics'
import {createInitialScene} from '@/features/scene/domain/services/scene-factory'

export interface SceneState {
  scene: SceneRoot
  selectedEntityIds: string[]
  projectName: string

  setScene: (scene: SceneRoot) => SceneRoot
  updateScene: (updater: (scene: SceneRoot) => void) => SceneRoot
  setMode: (mode: EditorMode) => SceneRoot
  setMapVisibility: (visible: boolean) => SceneRoot
  setMapStyle: (style: SceneMapStyle) => SceneRoot
  setSimulationSeed: (seed: number) => SceneRoot
  setSelection: (ids: string[]) => string[]
  clearSelection: () => string[]
  addArea: (geometry: PolygonGeometry) => SceneRoot
  setActiveArea: (areaId?: string) => SceneRoot
  updateAreaName: (areaId: string, name: string) => SceneRoot
  deleteArea: (areaId: string) => SceneRoot
  addWall: (wall: Omit<WallEntity, 'id'>) => SceneRoot
  addShape: (shape: Omit<ShapeEntity, 'id'>) => SceneRoot
  addCamera: (camera: Omit<CameraEntity, 'id' | 'ptz' | 'type'>) => SceneRoot
  updateCamera: (
    id: string,
    updater: (camera: CameraEntity) => void,
  ) => SceneRoot
  addPerson: (person: Omit<PersonEntity, 'id' | 'type'>) => SceneRoot
  updatePerson: (
    id: string,
    updater: (person: PersonEntity) => void,
  ) => SceneRoot
  deleteEntities: (ids: string[]) => SceneRoot
}

export interface SceneStoreInitialState extends Partial<SceneState> {
  editorMode?: EditorMode
  sceneOverrides?: Partial<SceneRoot>
}

type SetState = StoreApi<SceneState>['setState']
type GetState = StoreApi<SceneState>['getState']

const STORAGE_KEY = 'scene-store'

const isBrowser = () => typeof window !== 'undefined'

const loadSceneFromStorage = (): SceneRoot | null => {
  if (!isBrowser()) {
    return null
  }
  void STORAGE_KEY
  // NOTE: Local storage persistence is temporarily disabled.
  // Do not remove the commented code below; it will be re-enabled later.
  // const raw = window.localStorage.getItem(STORAGE_KEY)
  // if (!raw) {
  //   return null
  // }
  // try {
  //   const parsed = JSON.parse(raw) as SceneRoot
  //   return parsed
  // } catch (error) {
  //   console.warn('Failed to parse persisted scene', error)
  //   return null
  // }
  return null
}

const persistScene = (scene: SceneRoot) => {
  if (!isBrowser()) {
    return
  }
  void scene
  void STORAGE_KEY
  // NOTE: Local storage persistence is temporarily disabled.
  // Do not remove the commented code below; it will be re-enabled later.
  // try {
  //   window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
  // } catch (error) {
  //   console.warn('Failed to persist scene', error)
  // }
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

const setMode = (set: SetState, get: GetState, mode: EditorMode) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.editorMode = mode
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

const setMapStyle = (set: SetState, get: GetState, style: SceneMapStyle) => {
  const nextValue = produce<SceneState>((state) => {
    state.scene.meta.mapStyle = style
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
      createDefaultShape(id, shape.areaId, shape.shapeType, shape.geometry),
    )
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const getNextId = (existingIds: string[], prefix: string) => {
  const suffixes = existingIds
    .map((value) => Number.parseInt(value.replace(`${prefix}-`, ''), 10))
    .filter((value) => Number.isFinite(value))
  const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0
  return `${prefix}-${maxSuffix + 1}`
}

const createDefaultPtzState = (zoom: number, pan: number) => ({
  pan,
  tilt: 0,
  zoom,
  limits: {
    panMin: 0,
    panMax: 360,
    tiltMin: -45,
    tiltMax: 90,
    zoomMin: 1,
    zoomMax: 10,
  },
})

const addCamera = (
  set: SetState,
  get: GetState,
  camera: Omit<CameraEntity, 'id' | 'ptz' | 'type'>,
) => {
  const nextValue = produce<SceneState>((state) => {
    const id = getNextId(
      state.scene.cameras.map((item) => item.id),
      'camera',
    )
    const newCamera = createCameraEntity(
      {
        id,
        areaId: camera.areaId,
        sourceDeviceId: camera.sourceDeviceId,
        sourceDeviceName: camera.sourceDeviceName,
        sourceDeviceKind: camera.sourceDeviceKind,
        name: camera.name,
        optics: {
          fovHorizontal: camera.fovHorizontal,
          fovVertical: camera.fovVertical,
          depth: camera.depth,
          zoom: camera.zoom,
          height: camera.height,
          resolution: camera.resolution,
        },
        position: [camera.x, camera.y],
        color: camera.color,
        pan: 0,
      },
      state.scene.cameras.length,
    )
    state.scene.cameras.push({
      ...newCamera,
      name: camera.name ?? newCamera.name,
      sourceDeviceKind: camera.sourceDeviceKind ?? newCamera.sourceDeviceKind,
      sourceDeviceFeatures:
        camera.sourceDeviceFeatures ?? newCamera.sourceDeviceFeatures,
      fovHorizontal: camera.fovHorizontal ?? newCamera.fovHorizontal,
      fovVertical: camera.fovVertical ?? newCamera.fovVertical,
      depth: camera.depth ?? newCamera.depth,
      zoom: camera.zoom ?? newCamera.zoom,
      height: camera.height ?? newCamera.height,
      resolution: camera.resolution ?? newCamera.resolution,
      areaId: camera.areaId,
    })
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const addPerson = (
  set: SetState,
  get: GetState,
  person: Omit<PersonEntity, 'id' | 'type'>,
) => {
  const nextValue = produce<SceneState>((state) => {
    const id = getNextId(
      state.scene.people.map((item) => item.id),
      'person',
    )
    const base = createDefaultPerson(person.areaId, [person.x, person.y], id)
    state.scene.people.push({
      ...base,
      name: person.name ?? base.name,
      height: person.height ?? base.height,
      speed: person.speed ?? base.speed,
    })
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const updateCamera = (
  set: SetState,
  get: GetState,
  id: string,
  updater: (camera: CameraEntity) => void,
) => {
  const nextValue = produce<SceneState>((state) => {
    const camera = state.scene.cameras.find((item) => item.id === id)
    if (camera) {
      updater(camera)
      state.scene.meta.updatedAt = new Date().toISOString()
    }
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const updatePerson = (
  set: SetState,
  get: GetState,
  id: string,
  updater: (person: PersonEntity) => void,
) => {
  const nextValue = produce<SceneState>((state) => {
    const target = state.scene.people.find((item) => item.id === id)
    if (target) {
      updater(target)
      state.scene.meta.updatedAt = new Date().toISOString()
    }
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const deleteEntities = (set: SetState, get: GetState, ids: string[]) => {
  const nextValue = produce<SceneState>((state) => {
    ids.forEach((id) => {
      if (id.startsWith('area-')) {
        const target = state.scene.areas.find((area) => area.id === id)
        if (target) {
          state.scene.areas = state.scene.areas.filter(
            (area) => area.id !== target.id,
          )
          state.scene.walls = state.scene.walls.filter(
            (wall) => wall.areaId !== target.id,
          )
          state.scene.shapes = state.scene.shapes.filter(
            (shape) => shape.areaId !== target.id,
          )
          state.scene.cameras = state.scene.cameras.filter(
            (camera) => camera.areaId !== target.id,
          )
          state.scene.people = state.scene.people.filter(
            (person) => person.areaId !== target.id,
          )
          if (state.scene.activeAreaId === target.id) {
            state.scene.activeAreaId = state.scene.areas.at(0)?.id
          }
        }
      }

      if (id.startsWith('wall-')) {
        state.scene.walls = state.scene.walls.filter((wall) => wall.id !== id)
      }

      if (id.startsWith('shape-')) {
        state.scene.shapes = state.scene.shapes.filter(
          (shape) => shape.id !== id,
        )
      }

      if (id.startsWith('camera-')) {
        state.scene.cameras = state.scene.cameras.filter(
          (camera) => camera.id !== id,
        )
      }

      if (id.startsWith('person-')) {
        state.scene.people = state.scene.people.filter(
          (person) => person.id !== id,
        )
      }
    })

    state.selectedEntityIds = state.selectedEntityIds.filter(
      (selectedId) => !ids.includes(selectedId),
    )
    state.scene.meta.updatedAt = new Date().toISOString()
  })

  set(nextValue)
  const updated = get().scene
  persistScene(updated)
  return updated
}

const mergeSceneRoot = (base: SceneRoot, override: Partial<SceneRoot>) => ({
  ...base,
  ...override,
  origin: {...base.origin, ...override.origin},
  meta: {...base.meta, ...override.meta},
})

type CameraNormalizationInput = CameraEntity & {
  fov?: number
  sourceDeviceFeatures?: CameraSourceFeature[]
  ptz?: CameraEntity['ptz']
}

const resolveNormalizedSourceDeviceId = (camera: CameraEntity) =>
  camera.sourceDeviceId ?? camera.id

const resolveNormalizedSourceDeviceName = (camera: CameraEntity) =>
  camera.sourceDeviceName ?? camera.name ?? camera.sourceDeviceId ?? camera.id

const resolveNormalizedSourceDeviceKind = (camera: CameraEntity) =>
  camera.sourceDeviceKind ?? 'real'

const resolveNormalizedPtz = (
  camera: CameraEntity,
  normalizationInput: CameraNormalizationInput,
) => {
  if (normalizationInput.ptz) {
    return normalizationInput.ptz
  }
  const zoom = Number.isFinite(camera.zoom) ? camera.zoom : 1
  return createDefaultPtzState(zoom, 0)
}

const normalizeCameraEntity = (camera: CameraEntity): CameraEntity => {
  const normalizationInput = camera as CameraNormalizationInput

  const optics = createDefaultCameraOptics({
    fovHorizontal:
      Number.isFinite(camera.fovHorizontal) && camera.fovHorizontal > 0
        ? camera.fovHorizontal
        : normalizationInput.fov,
    fovVertical:
      Number.isFinite(camera.fovVertical) && camera.fovVertical > 0
        ? camera.fovVertical
        : undefined,
    depth: camera.depth,
    zoom: camera.zoom,
    height: camera.height,
    resolution: camera.resolution,
  })

  return {
    ...camera,
    sourceDeviceId: resolveNormalizedSourceDeviceId(camera),
    sourceDeviceName: resolveNormalizedSourceDeviceName(camera),
    sourceDeviceKind: resolveNormalizedSourceDeviceKind(camera),
    sourceDeviceFeatures:
      camera.sourceDeviceFeatures ??
      normalizationInput.sourceDeviceFeatures ??
      [],
    ptz: resolveNormalizedPtz(camera, normalizationInput),
    fovHorizontal: optics.fovHorizontal,
    fovVertical: optics.fovVertical,
    depth: optics.depth,
    zoom: optics.zoom,
    height: optics.height,
    resolution: optics.resolution,
  }
}

const resolveInitialScene = (initialValues: SceneStoreInitialState) => {
  const baseScene = createInitialScene()
  const persistedScene = loadSceneFromStorage()
  const withPersistedScene = persistedScene
    ? mergeSceneRoot(baseScene, persistedScene)
    : baseScene
  const withInitialScene = initialValues.scene
    ? mergeSceneRoot(withPersistedScene, initialValues.scene)
    : withPersistedScene
  const mergedScene = initialValues.sceneOverrides
    ? mergeSceneRoot(withInitialScene, initialValues.sceneOverrides)
    : withInitialScene
  if (!initialValues.editorMode) {
    return {
      ...mergedScene,
      cameras: mergedScene.cameras.map((camera) =>
        normalizeCameraEntity(camera),
      ),
    }
  }
  return {
    ...mergedScene,
    editorMode: initialValues.editorMode,
    cameras: mergedScene.cameras.map((camera) => normalizeCameraEntity(camera)),
  }
}

const createSceneStore: (
  initialValues: SceneStoreInitialState,
) => StateCreator<SceneState> = (initialValues) => {
  const {
    scene: _scene,
    editorMode: _editorMode,
    sceneOverrides: _sceneOverrides,
    ...restInitialValues
  } = initialValues

  return (set, get) => ({
    scene: resolveInitialScene(initialValues),
    projectName: initialValues.projectName ?? 'Untitled project',
    selectedEntityIds: restInitialValues.selectedEntityIds ?? [],
    setScene: (scene) => setScene(set, get, scene),
    updateScene: (updater) => updateScene(set, get, updater),
    setMode: (mode) => setMode(set, get, mode),
    setMapVisibility: (visible) => setMapVisibility(set, get, visible),
    setMapStyle: (style) => setMapStyle(set, get, style),
    setSimulationSeed: (seed) => setSimulationSeed(set, get, seed),
    setSelection: (ids) => setSelection(set, get, ids),
    clearSelection: () => clearSelection(set, get),
    addArea: (geometry) => addArea(set, get, geometry),
    setActiveArea: (areaId) => setActiveArea(set, get, areaId),
    updateAreaName: (areaId, name) => updateAreaName(set, get, areaId, name),
    deleteArea: (areaId) => deleteArea(set, get, areaId),
    addWall: (wall) => addWall(set, get, wall),
    addShape: (shape) => addShape(set, get, shape),
    addCamera: (camera) => addCamera(set, get, camera),
    updateCamera: (id, updater) => updateCamera(set, get, id, updater),
    addPerson: (person) => addPerson(set, get, person),
    updatePerson: (id, updater) => updatePerson(set, get, id, updater),
    deleteEntities: (entityIds) => deleteEntities(set, get, entityIds),
    ...restInitialValues,
  })
}

export const {
  Provider: SceneStoreProvider,
  useStore: useSceneStore,
  getState: getSceneStore,
} = createZustandContextStore<SceneState, SceneStoreInitialState>(
  createSceneStore,
)
