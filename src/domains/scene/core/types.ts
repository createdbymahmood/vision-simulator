export type SceneMode = "canvas" | "map";
export type Units = "meters";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Resolution {
  width: number;
  height: number;
}

export type ShapeKind = "rectangle" | "circle" | "triangle" | "line";
export type MaterialPreset = "drywall" | "concrete" | "glass" | "generic";
export type CameraPreset =
  | "basic"
  | "wide"
  | "telephoto"
  | "panoramic"
  | "indoor"
  | "outdoor"
  | "custom";

export interface WallSegment {
  id: string;
  kind: "wall";
  start: Vector2;
  end: Vector2;
  height: number;
  thickness: number;
  material: MaterialPreset;
  color: string;
  opacity: number;
}

export interface ShapeEntity {
  id: string;
  kind: "shape";
  shape: ShapeKind;
  position: Vector2;
  rotation: number;
  width: number;
  length: number;
  radius?: number;
  height: number;
  color: string;
  opacity: number;
  lineThickness?: number;
  blocksMovement: boolean;
  blocksVision: boolean;
}

export interface CameraDetection {
  personId: string;
  visible: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface CameraEntity {
  id: string;
  kind: "camera";
  typePreset: CameraPreset;
  position: Vector2;
  height: number;
  direction: number;
  fov: number;
  depth: number;
  zoom: number;
  nearPlane: number;
  resolution: Resolution;
  visionPolygon: Vector2[];
  detections: CameraDetection[];
}

export type PersonBehavior = "roam" | "path" | "script";

export interface PersonEntity {
  id: string;
  kind: "person";
  position: Vector2;
  radius: number;
  height: number;
  speed: number;
  behavior: PersonBehavior;
  areaId?: string;
  trailEnabled: boolean;
  trail: Vector2[];
  direction: number;
  target?: Vector2;
}

export interface AreaGeometry {
  points: Vector2[];
  curves?: { control: Vector2; end: Vector2 }[];
}

export interface AreaEntity {
  id: string;
  name: string;
  geometry: AreaGeometry;
  pointCount: number;
}

export interface BackgroundLayer {
  id: string;
  imageDataUrl?: string;
  opacity: number;
  scale: number;
  rotation: number;
  position: Vector2;
  locked: boolean;
}

export type SelectionKind =
  | { kind: "wall"; id: string }
  | { kind: "shape"; id: string }
  | { kind: "camera"; id: string }
  | { kind: "person"; id: string }
  | { kind: "area"; id: string }
  | { kind: "background" };

export type ToolId =
  | "select"
  | "wall"
  | "shape-rectangle"
  | "shape-circle"
  | "shape-triangle"
  | "shape-line"
  | "camera"
  | "person"
  | "area"
  | "background"
  | "hand";

export interface SceneMeta {
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface SceneSnapshot {
  version: string;
  mode: SceneMode;
  units: Units;
  background?: BackgroundLayer;
  areas: AreaEntity[];
  walls: WallSegment[];
  shapes: ShapeEntity[];
  cameras: CameraEntity[];
  people: PersonEntity[];
  meta: SceneMeta;
}

export interface HistoryCommand {
  label: string;
  redo: (draft: SceneState) => void;
  undo: (draft: SceneState) => void;
}

export interface HistoryState {
  undoStack: HistoryCommand[];
  redoStack: HistoryCommand[];
  limit: number;
}

export interface GridSettings {
  snapToGrid: boolean;
  measurementOverlay: boolean;
  gridSize: number;
}

export interface SimulationSettings {
  playing: boolean;
  lastTick: number | null;
  deterministicSeed: number;
  previewMode: "3d" | "2d";
  showTrails: boolean;
  showDebug: boolean;
  recording: boolean;
  recordScale: 1 | 2;
  cameraFeedResolution: Resolution;
}

export interface SceneState extends SceneSnapshot {
  selectionMode: boolean;
  selected: SelectionKind | null;
  activeTool: ToolId;
  history: HistoryState;
  grid: GridSettings;
  simulation: SimulationSettings;
}
