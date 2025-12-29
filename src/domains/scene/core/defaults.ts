import type {
  AreaEntity,
  BackgroundLayer,
  CameraEntity,
  CameraPreset,
  GridSettings,
  PersonEntity,
  SceneMode,
  SceneState,
  ShapeEntity,
  WallSegment,
} from "./types";
import { clampAngle } from "./geometry";

const makeId = () => crypto.randomUUID();

export const HISTORY_LIMIT = 200;
export const DEFAULT_UNITS = "meters" as const;

export const DEFAULT_GRID: GridSettings = {
  snapToGrid: true,
  measurementOverlay: true,
  gridSize: 1,
};

const NOW = () => new Date().toISOString();

const cameraPresetDefaults: Record<CameraPreset, Pick<CameraEntity, "fov" | "depth" | "height" | "zoom">> = {
  basic: { fov: 90, depth: 25, height: 2.5, zoom: 1 },
  wide: { fov: 120, depth: 20, height: 2.5, zoom: 0.9 },
  telephoto: { fov: 50, depth: 50, height: 3, zoom: 1.8 },
  panoramic: { fov: 180, depth: 30, height: 3, zoom: 0.8 },
  indoor: { fov: 95, depth: 18, height: 2.4, zoom: 1 },
  outdoor: { fov: 80, depth: 40, height: 3.5, zoom: 1.2 },
  custom: { fov: 90, depth: 25, height: 2.5, zoom: 1 },
};

export const DEFAULT_WALL_COLOR = "#0f172a";
export const DEFAULT_WALL_THICKNESS = 0.25;
export const DEFAULT_WALL_HEIGHT = 3;

export function createWallSegment(start: WallSegment["start"], end: WallSegment["end"]): WallSegment {
  return {
    id: makeId(),
    kind: "wall",
    start,
    end,
    height: DEFAULT_WALL_HEIGHT,
    thickness: DEFAULT_WALL_THICKNESS,
    material: "concrete",
    color: DEFAULT_WALL_COLOR,
    opacity: 0.8,
  };
}

export function createShape(shape: ShapeEntity["shape"], position: ShapeEntity["position"]): ShapeEntity {
  const base: ShapeEntity = {
    id: makeId(),
    kind: "shape",
    shape,
    position,
    rotation: 0,
    width: 2,
    length: 2,
    radius: 1,
    height: 1,
    color: "#0ea5e9",
    opacity: 0.4,
    blocksMovement: true,
    blocksVision: shape !== "line",
    lineThickness: shape === "line" ? 0.15 : undefined,
  };
  return base;
}

export function createCamera(position: CameraEntity["position"], preset: CameraPreset = "basic"): CameraEntity {
  const defaults = cameraPresetDefaults[preset];
  return {
    id: makeId(),
    kind: "camera",
    typePreset: preset,
    position,
    height: defaults.height,
    direction: 0,
    fov: defaults.fov,
    depth: defaults.depth,
    zoom: defaults.zoom,
    nearPlane: 0.1,
    resolution: { width: 1280, height: 720 },
    visionPolygon: [],
    detections: [],
  };
}

export function createPerson(position: PersonEntity["position"]): PersonEntity {
  return {
    id: makeId(),
    kind: "person",
    position,
    radius: 0.35,
    height: 1.7,
    speed: 1.2,
    behavior: "roam",
    trailEnabled: true,
    trail: [],
    direction: 0,
  };
}

export function createArea(name: string, points: AreaEntity["geometry"]["points"]): AreaEntity {
  return {
    id: makeId(),
    name,
    geometry: { points },
    pointCount: points.length,
  };
}

export function createBackground(): BackgroundLayer {
  return {
    id: makeId(),
    opacity: 0.6,
    scale: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    locked: false,
  };
}

export function baseSceneState(mode: SceneMode): SceneState {
  return {
    version: "1.0",
    mode,
    units: DEFAULT_UNITS,
    background: undefined,
    areas: [],
    walls: [],
    shapes: [],
    cameras: [],
    people: [],
    meta: {
      createdAt: NOW(),
      updatedAt: NOW(),
      version: "1.0",
    },
    selectionMode: true,
    selected: null,
    activeTool: "select",
    history: { undoStack: [], redoStack: [], limit: HISTORY_LIMIT },
    grid: DEFAULT_GRID,
    simulation: {
      playing: false,
      lastTick: null,
      deterministicSeed: 1,
      previewMode: "3d",
      showTrails: true,
      showDebug: false,
      recording: false,
      recordScale: 1,
      cameraFeedResolution: { width: 640, height: 360 },
    },
  };
}

export function clampFov(value: number) {
  return Math.min(180, Math.max(1, value));
}

export function clampDepth(value: number) {
  return Math.max(0.1, value);
}

export function normalizeDirection(angle: number) {
  return clampAngle(angle % 360);
}
