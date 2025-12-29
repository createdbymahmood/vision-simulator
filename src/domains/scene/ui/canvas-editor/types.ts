export type CanvasPoint = { x: number; y: number };

export interface CanvasSize {
  width: number;
  height: number;
}

export interface DrawingWallState {
  anchors: CanvasPoint[];
  preview: CanvasPoint | null;
}

export interface DrawingShapeState {
  start: CanvasPoint;
  current: CanvasPoint;
}

export interface CanvasMeasurement {
  length: number;
  angle: number;
  screen: CanvasPoint;
}
