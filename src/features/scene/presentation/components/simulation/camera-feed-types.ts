import type {RefObject} from 'react'

export interface CameraFeedTarget {
  id: string
  containerRef: RefObject<HTMLDivElement>
  canvasRef: RefObject<HTMLCanvasElement>
}
