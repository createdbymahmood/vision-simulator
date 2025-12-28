import type {
  AreaEntity,
  BackgroundLayer,
  CameraEntity,
  HistoryCommand,
  PersonEntity,
  SceneSnapshot,
  SceneState,
  ShapeEntity,
  WallSegment,
} from "../types";

export type EntityCollectionKey = "walls" | "shapes" | "cameras" | "people" | "areas";

type EntityMap = {
  walls: WallSegment;
  shapes: ShapeEntity;
  cameras: CameraEntity;
  people: PersonEntity;
  areas: AreaEntity;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeAddCommand<K extends EntityCollectionKey>(
  key: K,
  entity: EntityMap[K]
): HistoryCommand {
  return {
    label: `add-${key}`,
    redo: (state) => {
      (state[key] as EntityMap[K][]).push(clone(entity));
      state.selected = { kind: key.slice(0, -1) as any, id: entity.id };
    },
    undo: (state) => {
      state[key] = (state[key] as EntityMap[K][]).filter((item) => item.id !== entity.id) as any;
      if (state.selected && "id" in state.selected && state.selected.id === entity.id) {
        state.selected = null;
      }
    },
  };
}

function makeRemoveCommand<K extends EntityCollectionKey>(
  key: K,
  id: string,
  previous: EntityMap[K]
): HistoryCommand {
  return {
    label: `remove-${key}`,
    redo: (state) => {
      state[key] = (state[key] as EntityMap[K][]).filter((item) => item.id !== id) as any;
      if (state.selected && "id" in state.selected && state.selected.id === id) {
        state.selected = null;
      }
    },
    undo: (state) => {
      (state[key] as EntityMap[K][]).push(clone(previous));
    },
  };
}

function makeUpdateCommand<K extends EntityCollectionKey>(
  key: K,
  id: string,
  previous: EntityMap[K],
  patch: Partial<EntityMap[K]>
): HistoryCommand {
  return {
    label: `update-${key}`,
    redo: (state) => {
      const list = state[key] as EntityMap[K][];
      const next = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
      state[key] = next as any;
    },
    undo: (state) => {
      const list = state[key] as EntityMap[K][];
      state[key] = list.map((item) => (item.id === id ? clone(previous) : item)) as any;
    },
  };
}

export const sceneCommands = {
  addWall: (wall: WallSegment) => makeAddCommand("walls", wall),
  addShape: (shape: ShapeEntity) => makeAddCommand("shapes", shape),
  addCamera: (camera: CameraEntity) => makeAddCommand("cameras", camera),
  addPerson: (person: PersonEntity) => makeAddCommand("people", person),
  addArea: (area: AreaEntity) => makeAddCommand("areas", area),
  removeWall: (wall: WallSegment) => makeRemoveCommand("walls", wall.id, wall),
  removeShape: (shape: ShapeEntity) => makeRemoveCommand("shapes", shape.id, shape),
  removeCamera: (camera: CameraEntity) => makeRemoveCommand("cameras", camera.id, camera),
  removePerson: (person: PersonEntity) => makeRemoveCommand("people", person.id, person),
  removeArea: (area: AreaEntity) => makeRemoveCommand("areas", area.id, area),
  updateWall: (current: WallSegment, patch: Partial<WallSegment>) =>
    makeUpdateCommand("walls", current.id, current, patch),
  updateShape: (current: ShapeEntity, patch: Partial<ShapeEntity>) =>
    makeUpdateCommand("shapes", current.id, current, patch),
  updateCamera: (current: CameraEntity, patch: Partial<CameraEntity>) =>
    makeUpdateCommand("cameras", current.id, current, patch),
  updatePerson: (current: PersonEntity, patch: Partial<PersonEntity>) =>
    makeUpdateCommand("people", current.id, current, patch),
  updateArea: (current: AreaEntity, patch: Partial<AreaEntity>) =>
    makeUpdateCommand("areas", current.id, current, patch),
  clearScene: (snapshot: SceneSnapshot): HistoryCommand => ({
    label: "clear-scene",
    redo: (state: SceneState) => {
      state.walls = [];
      state.shapes = [];
      state.cameras = [];
      state.people = [];
      state.areas = [];
      state.background = undefined;
      state.selected = null;
      state.meta = { ...state.meta, updatedAt: new Date().toISOString() };
    },
    undo: (state: SceneState) => {
      state.walls = clone(snapshot.walls);
      state.shapes = clone(snapshot.shapes);
      state.cameras = clone(snapshot.cameras);
      state.people = clone(snapshot.people);
      state.areas = clone(snapshot.areas);
      state.background = snapshot.background ? clone(snapshot.background) : undefined;
      state.meta = { ...state.meta, updatedAt: snapshot.meta.updatedAt };
    },
  }),
  setBackground: (previous: BackgroundLayer | undefined, layer?: BackgroundLayer): HistoryCommand => ({
    label: "set-background",
    redo: (state) => {
      state.background = layer ? clone(layer) : undefined;
    },
    undo: (state) => {
      state.background = previous ? clone(previous) : undefined;
    },
  }),
};
