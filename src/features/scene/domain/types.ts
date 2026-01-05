export type SceneVersion = '1.1'

export type SceneMode = 'canvas' | 'map'

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

export interface Point2D {
  x: number
  y: number
}

export interface PolygonGeometry {
  type: 'polygon'
  coordinates: Point2D[]
  bezierControls: Point2D[]
}

export type BoundaryMode = 'strict'

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
  boundaryMode: BoundaryMode
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

export interface CameraEntity {
  id: string
  type: 'camera'
  areaId: string
  typePreset: string
  x: number
  y: number
  height: number
  direction: number
  fov: number
  depth: number
  zoom: number
  nearClipping: number
  resolution: Resolution
  color: string
  ptz: PtzState
  ptzPresets: PtzPreset[]
  showCollisions: boolean
}

export interface PersonEntity {
  id: string
  type: 'person'
  areaId: string
  x: number
  y: number
  radius: number
  height: number
  speed: number
  behavior: 'roam'
  trailEnabled: boolean
  trailLength: number
  trailHistory: Point2D[]
}

export interface WallEntity {
  id: string
  type: 'wall'
  areaId: string
  points: Point2D[]
  thickness: number
  height: number
  color: string
}

interface BaseShapeEntity {
  id: string
  type: 'shape'
  areaId: string
  height: number
  color: string
}

export interface RectangleShapeEntity extends BaseShapeEntity {
  shapeType: 'rectangle'
  x: number
  y: number
  width: number
  length: number
  rotation: number
}

export interface CircleShapeEntity extends BaseShapeEntity {
  shapeType: 'circle'
  x: number
  y: number
  radius: number
}

export interface TriangleShapeEntity extends BaseShapeEntity {
  shapeType: 'triangle'
  points: [Point2D, Point2D, Point2D]
}

export interface LineShapeEntity extends BaseShapeEntity {
  shapeType: 'line'
  points: [Point2D, Point2D]
  thickness: number
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
  mode: SceneMode
  mapVisible: boolean
  units: Units
  origin: GeoOrigin
  simulationSeed: number
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameras: CameraEntity[]
  people: PersonEntity[]
  meta: SceneMeta
}
