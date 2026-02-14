import type {FeatureCollection, LineString, Polygon} from 'geojson'

import type {
  AreaEntity,
  CameraEntity,
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

export type CameraFovWorkerRequest =
  | CameraFovWorkerComputeMessage
  | CameraFovWorkerSetStaticMessage

export interface CameraFovWorkerResultMessage {
  type: 'result'
  requestId: number
  fovs: FeatureCollection<Polygon>
  directions: FeatureCollection<LineString>
}

export interface CameraFovWorkerErrorMessage {
  type: 'error'
  requestId: number
  message: string
}

export type CameraFovWorkerResponse =
  | CameraFovWorkerErrorMessage
  | CameraFovWorkerResultMessage
