export type SceneVersion = '1.1'

export type EditorMode = 'canvas' | 'map'

export type Units = 'meters'

export type ViewMode = 'editor' | 'preview'

export type SceneMapStyle = 'osm' | 'satellite' | 'street' | 'traffic'

export interface GeoOrigin {
  lat: number
  lng: number
  description: string
}

export interface SceneMeta {
  createdAt: string
  updatedAt: string
  mapStyle: SceneMapStyle
  radarEnabled: boolean
  collisionVisualizationEnabled: boolean
}

export type GeoPoint = [number, number]

export interface Point2D {
  x: number
  y: number
}

export interface PolygonGeometry {
  type: 'polygon'
  coordinates: GeoPoint[]
  bezierControls: GeoPoint[]
}

export interface AreaStyle {
  fillColor: string
  fillOpacity: number
  borderColor: string
  borderWidth: number
}

export interface AreaEntity {
  id: string
  type: 'area'
  name: string
  geometry: PolygonGeometry
  pointCount: number
  color: string
  style: AreaStyle
}

export interface Resolution {
  width: number
  height: number
}

export interface PtzLimits {
  panMin: number
  panMax: number
  tiltMin: number
  tiltMax: number
  zoomMin: number
  zoomMax: number
}

export interface PtzPreset {
  name: string
  pan: number
  tilt: number
  zoom: number
}

export interface PtzState {
  pan: number
  tilt: number
  zoom: number
  limits: PtzLimits
}

export interface CameraSourceFeature {
  field?: string
  label?: string
  path?: string
  unit?: string
  value?: string
}

export interface CameraOptics {
  fovHorizontal: number
  fovVertical: number
  depth: number
  zoom: number
  height: number
  resolution: Resolution
}

export type CameraSourceDeviceKind = 'real' | 'virtual'

export interface CameraPlacementProfile {
  id: string
  name: string
  description: string
  sourceDeviceKind: CameraSourceDeviceKind
  optics: CameraOptics
  features: CameraSourceFeature[]
}

export interface CameraEntity {
  id: string
  type: 'camera'
  name: string
  areaId: string
  sourceDeviceId: string
  sourceDeviceName: string
  sourceDeviceKind: CameraSourceDeviceKind
  x: number
  y: number
  height: number
  direction: number
  fovHorizontal: number
  fovVertical: number
  depth: number
  zoom: number
  resolution: Resolution
  color: string
  sourceDeviceFeatures: CameraSourceFeature[]
  ptz: PtzState
  ptzPresets: PtzPreset[]
}

export interface PersonEntity {
  id: string
  type: 'person'
  name: string
  areaId: string
  x: number
  y: number
  height: number
  speed: number
}

export interface WallEntity {
  id: string
  type: 'wall'
  areaId: string
  points: GeoPoint[]
  thickness: number
  height: number
  color: string
}

interface BaseShapeEntity {
  id: string
  type: 'shape'
  areaId: string
  geometry: GeoPoint[]
  height: number
  color: string
  rotation?: number
}

export interface RectangleShapeEntity extends BaseShapeEntity {
  shapeType: 'rectangle'
  width?: number
  length?: number
  rotation?: number
}

export interface CircleShapeEntity extends BaseShapeEntity {
  shapeType: 'circle'
  radius?: number
}

export interface TriangleShapeEntity extends BaseShapeEntity {
  shapeType: 'triangle'
  points?: [GeoPoint, GeoPoint, GeoPoint]
}

export interface LineShapeEntity extends BaseShapeEntity {
  shapeType: 'line'
  points?: [GeoPoint, GeoPoint]
  thickness?: number
}

export type ShapeEntity =
  | CircleShapeEntity
  | LineShapeEntity
  | RectangleShapeEntity
  | TriangleShapeEntity

export type SceneEntity =
  | AreaEntity
  | CameraEntity
  | PersonEntity
  | ShapeEntity
  | WallEntity

export interface SceneRoot {
  version: SceneVersion
  editorMode: EditorMode
  mapVisible: boolean
  units: Units
  origin: GeoOrigin
  simulationSeed: number
  activeAreaId?: string
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameras: CameraEntity[]
  people: PersonEntity[]
  meta: SceneMeta
}
