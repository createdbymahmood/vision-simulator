export interface SimulationCaptureApi {
  getCanvas: () => HTMLCanvasElement | null
  captureFrame: (scale?: number) => string | null
}
