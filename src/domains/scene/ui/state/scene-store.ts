import { produce } from "immer";
import type { StateCreator } from "zustand";
import { createZustandContextStore } from "@/components/shared/zustand";
import type {
  AreaEntity,
  BackgroundLayer,
  CameraEntity,
  GridSettings,
  PersonEntity,
  SceneMode,
  SceneSnapshot,
  SceneState,
  SelectionKind,
  ShapeEntity,
  ToolId,
  WallSegment,
} from "../../core/types";
import { baseSceneState, createArea, createCamera, createPerson, createShape, createWallSegment } from "../../core/defaults";
import { applyCommand, redo, undo } from "../../core/history";
import { sceneCommands } from "../../core/use-cases/scene-commands";
import { stepSimulation } from "../../core/use-cases/simulation";

export interface SceneStore extends SceneState {
  setMode: (mode: SceneMode) => void;
  setSelectionMode: (on: boolean) => void;
  setActiveTool: (tool: ToolId) => void;
  setSelection: (selection: SelectionKind | null) => void;
  setGrid: (grid: Partial<GridSettings>) => void;
  addWall: (start: WallSegment["start"], end: WallSegment["end"]) => string;
  addShape: (shape: ShapeEntity["shape"], position: ShapeEntity["position"], overrides?: Partial<ShapeEntity>) => string;
  addCamera: (position: CameraEntity["position"], preset?: CameraEntity["typePreset"]) => string;
  addPerson: (position: PersonEntity["position"], areaId?: string) => string;
  addArea: (name: string, points: { x: number; y: number }[]) => string;
  removeWall: (id: string) => void;
  removeShape: (id: string) => void;
  removeCamera: (id: string) => void;
  removePerson: (id: string) => void;
  removeArea: (id: string) => void;
  updateWall: (id: string, patch: Partial<WallSegment>) => void;
  updateShape: (id: string, patch: Partial<ShapeEntity>) => void;
  updateCamera: (id: string, patch: Partial<CameraEntity>) => void;
  updatePerson: (id: string, patch: Partial<PersonEntity>) => void;
  updateArea: (id: string, patch: Partial<AreaEntity>) => void;
  setBackground: (background?: BackgroundLayer) => void;
  clearScene: () => void;
  undo: () => void;
  redo: () => void;
  play: () => void;
  pause: () => void;
  tick: (deltaMs: number) => void;
  setSimulationPreviewMode: (mode: "3d" | "2d") => void;
  setRecording: (on: boolean) => void;
  exportSnapshot: () => SceneSnapshot;
  importSnapshot: (snapshot: SceneSnapshot) => void;
  summary: () => { walls: number; shapes: number; cameras: number; people: number; areas: number };
}

const initializer = (initial: Partial<SceneState>): StateCreator<SceneStore> => (set, get) => ({
  ...baseSceneState(initial.mode ?? "canvas"),
  ...initial,
  setMode: (mode) =>
    set(
      produce<SceneStore>((draft) => {
        draft.mode = mode;
      })
    ),
  setSelectionMode: (on) =>
    set(
      produce<SceneStore>((draft) => {
        draft.selectionMode = on;
        if (!on) draft.selected = null;
      })
    ),
  setActiveTool: (tool) =>
    set(
      produce<SceneStore>((draft) => {
        draft.activeTool = tool;
      })
    ),
  setSelection: (selection) =>
    set(
      produce<SceneStore>((draft) => {
        draft.selected = selection;
      })
    ),
  setGrid: (grid) =>
    set(
      produce<SceneStore>((draft) => {
        draft.grid = { ...draft.grid, ...grid };
      })
    ),
  addWall: (start, end) => {
    let id = "";
    set(
      produce<SceneStore>((draft) => {
        const wall = createWallSegment(start, end);
        id = wall.id;
        const command = sceneCommands.addWall(wall);
        applyCommand(draft, command);
      })
    );
    return id;
  },
  addShape: (shape, position, overrides) => {
    let id = "";
    set(
      produce<SceneStore>((draft) => {
        const created = { ...createShape(shape, position), ...overrides };
        id = created.id;
        const command = sceneCommands.addShape(created);
        applyCommand(draft, command);
      })
    );
    return id;
  },
  addCamera: (position, preset = "basic") => {
    let id = "";
    set(
      produce<SceneStore>((draft) => {
        const camera = createCamera(position, preset);
        id = camera.id;
        const command = sceneCommands.addCamera(camera);
        applyCommand(draft, command);
      })
    );
    return id;
  },
  addPerson: (position, areaId) => {
    let id = "";
    set(
      produce<SceneStore>((draft) => {
        const person = createPerson(position);
        person.areaId = areaId;
        id = person.id;
        const command = sceneCommands.addPerson(person);
        applyCommand(draft, command);
      })
    );
    return id;
  },
  addArea: (name, points) => {
    let id = "";
    set(
      produce<SceneStore>((draft) => {
        const area = createArea(name, points);
        id = area.id;
        const command = sceneCommands.addArea(area);
        applyCommand(draft, command);
      })
    );
    return id;
  },
  removeWall: (id) =>
    set(
      produce<SceneStore>((draft) => {
        const wall = draft.walls.find((item) => item.id === id);
        if (!wall) return;
        const command = sceneCommands.removeWall(wall);
        applyCommand(draft, command);
      })
    ),
  removeShape: (id) =>
    set(
      produce<SceneStore>((draft) => {
        const shape = draft.shapes.find((item) => item.id === id);
        if (!shape) return;
        const command = sceneCommands.removeShape(shape);
        applyCommand(draft, command);
      })
    ),
  removeCamera: (id) =>
    set(
      produce<SceneStore>((draft) => {
        const camera = draft.cameras.find((item) => item.id === id);
        if (!camera) return;
        const command = sceneCommands.removeCamera(camera);
        applyCommand(draft, command);
      })
    ),
  removePerson: (id) =>
    set(
      produce<SceneStore>((draft) => {
        const person = draft.people.find((item) => item.id === id);
        if (!person) return;
        const command = sceneCommands.removePerson(person);
        applyCommand(draft, command);
      })
    ),
  removeArea: (id) =>
    set(
      produce<SceneStore>((draft) => {
        const area = draft.areas.find((item) => item.id === id);
        if (!area) return;
        const command = sceneCommands.removeArea(area);
        applyCommand(draft, command);
      })
    ),
  updateWall: (id, patch) =>
    set(
      produce<SceneStore>((draft) => {
        const current = draft.walls.find((wall) => wall.id === id);
        if (!current) return;
        const command = sceneCommands.updateWall(current, patch);
        applyCommand(draft, command);
      })
    ),
  updateShape: (id, patch) =>
    set(
      produce<SceneStore>((draft) => {
        const current = draft.shapes.find((item) => item.id === id);
        if (!current) return;
        const command = sceneCommands.updateShape(current, patch);
        applyCommand(draft, command);
      })
    ),
  updateCamera: (id, patch) =>
    set(
      produce<SceneStore>((draft) => {
        const current = draft.cameras.find((item) => item.id === id);
        if (!current) return;
        const command = sceneCommands.updateCamera(current, patch);
        applyCommand(draft, command);
      })
    ),
  updatePerson: (id, patch) =>
    set(
      produce<SceneStore>((draft) => {
        const current = draft.people.find((item) => item.id === id);
        if (!current) return;
        const command = sceneCommands.updatePerson(current, patch);
        applyCommand(draft, command);
      })
    ),
  updateArea: (id, patch) =>
    set(
      produce<SceneStore>((draft) => {
        const current = draft.areas.find((item) => item.id === id);
        if (!current) return;
        const command = sceneCommands.updateArea(current, patch);
        applyCommand(draft, command);
      })
    ),
  setBackground: (background) =>
    set(
      produce<SceneStore>((draft) => {
        const command = sceneCommands.setBackground(draft.background, background);
        applyCommand(draft, command);
      })
    ),
  clearScene: () =>
    set(
      produce<SceneStore>((draft) => {
        const snapshot: SceneSnapshot = {
          version: draft.version,
          mode: draft.mode,
          units: draft.units,
          areas: structuredClone(draft.areas),
          walls: structuredClone(draft.walls),
          shapes: structuredClone(draft.shapes),
          cameras: structuredClone(draft.cameras),
          people: structuredClone(draft.people),
          background: draft.background ? structuredClone(draft.background) : undefined,
          meta: structuredClone(draft.meta),
        };
        const command = sceneCommands.clearScene(snapshot);
        applyCommand(draft, command);
      })
    ),
  undo: () =>
    set(
      produce<SceneStore>((draft) => {
        undo(draft);
      })
    ),
  redo: () =>
    set(
      produce<SceneStore>((draft) => {
        redo(draft);
      })
    ),
  play: () =>
    set(
      produce<SceneStore>((draft) => {
        draft.simulation.playing = true;
      })
    ),
  pause: () =>
    set(
      produce<SceneStore>((draft) => {
        draft.simulation.playing = false;
        draft.simulation.lastTick = null;
      })
    ),
  tick: (deltaMs) =>
    set(
      produce<SceneStore>((draft) => {
        stepSimulation(draft, deltaMs);
      })
    ),
  setSimulationPreviewMode: (mode) =>
    set(
      produce<SceneStore>((draft) => {
        draft.simulation.previewMode = mode;
      })
    ),
  setRecording: (on) =>
    set(
      produce<SceneStore>((draft) => {
        draft.simulation.recording = on;
      })
    ),
  exportSnapshot: () => {
    const state = get();
    return {
      version: state.version,
      mode: state.mode,
      units: state.units,
      areas: state.areas,
      walls: state.walls,
      shapes: state.shapes,
      cameras: state.cameras,
      people: state.people,
      background: state.background,
      meta: state.meta,
    } satisfies SceneSnapshot;
  },
  importSnapshot: (snapshot) =>
    set(
      produce<SceneStore>((draft) => {
        draft.version = snapshot.version;
        draft.mode = snapshot.mode;
        draft.units = snapshot.units;
        draft.areas = snapshot.areas;
        draft.walls = snapshot.walls;
        draft.shapes = snapshot.shapes;
        draft.cameras = snapshot.cameras;
        draft.people = snapshot.people;
        draft.background = snapshot.background;
        draft.meta = snapshot.meta;
      })
    ),
  summary: () => {
    const state = get();
    return {
      walls: state.walls.length,
      shapes: state.shapes.length,
      cameras: state.cameras.length,
      people: state.people.length,
      areas: state.areas.length,
    };
  },
});

export const { Provider: SceneStoreProvider, useStore: useSceneStore, getState: getSceneStore } =
  createZustandContextStore<SceneStore, Partial<SceneState>>(initializer);

export function useSceneSummary() {
  return useSceneStore((state) => state.summary());
}
