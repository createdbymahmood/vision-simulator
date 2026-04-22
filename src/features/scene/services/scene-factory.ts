import type {SceneMapStyle, SceneRoot, SceneVersion} from '@/features/scene/types/types'

import initialSceneTemplate from '@/data-provider/initial-scene.json'

const DEFAULT_SCENE_VERSION: SceneVersion = '1.1'

const getIsoTimestamp = () => new Date().toISOString()

const defaultMeta = (mapStyle: SceneMapStyle) => ({
  createdAt: getIsoTimestamp(),
  updatedAt: getIsoTimestamp(),
  mapStyle,
  radarEnabled: false,
  collisionVisualizationEnabled: false,
})

const mergeSceneRoot = (base: SceneRoot, override: Partial<SceneRoot>) => ({
  ...base,
  ...override,
  origin: {...base.origin, ...(override.origin ?? {})},
  meta: {...base.meta, ...(override.meta ?? {})},
})

const INITIAL_SCENE_TEMPLATE = initialSceneTemplate as unknown as Partial<SceneRoot>

export const createInitialScene = (): SceneRoot =>
  mergeSceneRoot(
    {
      version: DEFAULT_SCENE_VERSION,
      editorMode: 'map',
      mapVisible: true,
      units: 'meters',
      origin: {lat: 0, lng: 0, description: 'Geographic reference point'},
      simulationSeed: Date.now(),
      activeAreaId: undefined,
      areas: [],
      walls: [],
      shapes: [],
      cameras: [],
      people: [],
      meta: defaultMeta('street'),
    },
    INITIAL_SCENE_TEMPLATE,
  )

export const touchSceneUpdatedAt = (scene: SceneRoot) => ({
  ...scene,
  meta: {
    ...scene.meta,
    updatedAt: getIsoTimestamp(),
  },
})
