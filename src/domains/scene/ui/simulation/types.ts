import type {PersonVisibility} from '../../simulation/core/camera-vision'
import type {CanvasPoint} from '../canvas-editor/types'

export interface CameraVision {
  id: string
  points: CanvasPoint[]
  height: number
  visiblePeople: PersonVisibility[]
  sampleCount: number
}

export interface SimulationViewportHandle {
  getSnapshot: (scale: number) => Promise<string>
  getStream: () => MediaStream | null
}
