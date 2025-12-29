export type SceneMode = 'canvas' | 'map'

export type SceneUnits = 'meters'

export type SceneEntityKind = 'area' | 'camera' | 'person' | 'shape' | 'wall'

export type SceneShapeKind = 'circle' | 'line' | 'rectangle' | 'triangle'

export type SceneSelectionMode = 'multi' | 'single'

export interface SceneBackground {
  type: 'image' | 'solid'
  value: string
  opacity?: number
}

export interface SceneWall {
  id: string
  type: 'wall'
  coordinates: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  height: number
  thickness: number
  color: string
  opacity: number
}

export interface SceneShape {
  id: string
  type: SceneShapeKind
  x: number
  y: number
  rotation: number
  width: number
  length: number
  height: number
  color: string
  opacity: number
  lineThickness: number
}

export interface SceneCamera {
  id: string
  typePreset: string
  x: number
  y: number
  height: number
  direction: number
  fov: number
  depth: number
  zoom: number
  resolution: string
  nearPlane: number
}

export interface ScenePerson {
  id: string
  x: number
  y: number
  radius: number
  height: number
  speed: number
  behavior: string
  trailEnabled: boolean
}

export interface SceneArea {
  id: string
  name: string
  geometry: {lat: number; lng: number}[]
  pointCount: number
}

export interface SceneMeta {
  name: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface Scene {
  version: number
  mode: SceneMode
  units: SceneUnits
  background?: SceneBackground
  areas: SceneArea[]
  walls: SceneWall[]
  shapes: SceneShape[]
  cameras: SceneCamera[]
  people: ScenePerson[]
  meta: SceneMeta
}

export type SceneEntity =
  | SceneArea
  | SceneCamera
  | ScenePerson
  | SceneShape
  | SceneWall

export type SceneTool =
  | 'area'
  | 'camera'
  | 'person'
  | 'select'
  | 'shape'
  | 'wall'

export interface SceneSelection {
  selectedEntityId: string | null
  selectedEntityKind: SceneEntityKind | null
  mode: SceneSelectionMode
}
