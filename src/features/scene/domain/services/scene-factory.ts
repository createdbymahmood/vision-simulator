import type {SceneMapStyle, SceneRoot, SceneVersion} from '../types'

const DEFAULT_SCENE_VERSION: SceneVersion = '1.1'

const getIsoTimestamp = () => new Date().toISOString()

const defaultMeta = (mapStyle: SceneMapStyle) => ({
  createdAt: getIsoTimestamp(),
  updatedAt: getIsoTimestamp(),
  mapStyle,
  radarEnabled: false,
  collisionVisualizationEnabled: false,
})

export const createInitialScene = (): SceneRoot => ({
  version: DEFAULT_SCENE_VERSION,
  mode: 'map',
  mapVisible: true,
  units: 'meters',
  origin: {lat: 0, lng: 0, description: 'Geographic reference point'},
  simulationSeed: Date.now(),
  areas: [],
  walls: [],
  shapes: [],
  cameras: [],
  people: [],
  meta: defaultMeta('street'),
})

export const touchSceneUpdatedAt = (scene: SceneRoot) => ({
  ...scene,
  meta: {
    ...scene.meta,
    updatedAt: getIsoTimestamp(),
  },
})
