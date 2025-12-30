import type {CanvasPoint} from '../canvas-editor/types'

export interface CameraVision {
  id: string
  points: CanvasPoint[]
  height: number
}
