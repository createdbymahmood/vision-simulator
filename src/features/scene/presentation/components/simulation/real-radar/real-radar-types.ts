import type {RealRadarActivityItem} from '../simulation-real-radar-activities'

export interface CameraIntrinsics {
  cx?: number
  cy?: number
  fx?: number
  fy?: number
  hfov_deg?: number
  image_height: number
  image_width: number
  vfov_deg?: number
}

export interface CameraState {
  camera_lat: number
  camera_lon: number
  camera_height_m: number
  yaw_deg: number
  pitch_deg: number
  roll_deg: number
  intrinsics: CameraIntrinsics
}

export interface RadarPayloadCamera {
  alt_m?: number
  height_m?: number
  id?: string
  index?: number
  lat?: number
  lon?: number
  pitch_deg?: number
  roll_deg?: number
  yaw_deg?: number
}

export interface RadarPayloadDetection {
  bbox?: {
    h?: number
    w?: number
    x?: number
    y?: number
  }
  class?: string
  confidence?: number
  image_point?: {
    u?: number
    v?: number
  }
  trackerId?: number | string
}

export interface RadarPayloadGeo {
  distance_m?: number
  object_lat?: number
  object_lon?: number
}

export interface RadarPayloadSourceCamera {
  camera_alt_m?: number
  camera_height_m?: number
  camera_lat?: number
  camera_lon?: number
  detection_point?: {
    rule?: string
  }
  geo?: {
    max_distance_m?: number
    min_distance_m?: number
  }
  intrinsics?: Partial<CameraIntrinsics>
  pitch_deg?: number
  roll_deg?: number
  yaw_deg?: number
}

export interface RadarMessage {
  camera?: RadarPayloadCamera
  detection?: RadarPayloadDetection
  geo?: RadarPayloadGeo
  logic?: string
  source_camera?: RadarPayloadSourceCamera
  timestamp?: string
  ts?: number
}

export interface DetectionState {
  id: string
  trackerId: string
  cameraId: string
  lat: number
  lon: number
  className: string
  confidence?: number
  ts?: number
}

export type RadarUpdateByTracker = Record<string, RealRadarActivityItem>
