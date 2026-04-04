import type {RefObject} from 'react'

export interface CameraFeedTarget {
  id: string
  containerRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
}
