import type {FeatureCollection, LineString, Polygon} from 'geojson'

import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'

export interface CameraFovWorkerSetStaticMessage {
  type: 'set-static'
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
}

export interface CameraFovWorkerComputeMessage {
  type: 'compute-fov'
  requestId: number
  cameras: CameraEntity[]
}

export interface CameraFovWorkerComputePreviewMessage {
  type: 'compute-preview-fov'
  requestId: number
  origin: GeoPoint
  direction: number
  fov: number
  depth: number
  cameraHeight: number
  areaId?: string
}

export type CameraFovWorkerRequest =
  | CameraFovWorkerComputeMessage
  | CameraFovWorkerComputePreviewMessage
  | CameraFovWorkerSetStaticMessage

export interface CameraFovWorkerResultMessage {
  type: 'result'
  requestId: number
  fovs: FeatureCollection<Polygon>
  directions: FeatureCollection<LineString>
}

export interface CameraFovWorkerPreviewResultMessage {
  type: 'preview-result'
  requestId: number
  ring: GeoPoint[]
  area: number
}

export interface CameraFovWorkerErrorMessage {
  type: 'error'
  requestId: number
  message: string
}

export type CameraFovWorkerResponse =
  | CameraFovWorkerErrorMessage
  | CameraFovWorkerPreviewResultMessage
  | CameraFovWorkerResultMessage
