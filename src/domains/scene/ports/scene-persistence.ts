import type { SceneSnapshot } from "../core/types";

export interface ScenePersistencePort {
  save(snapshot: SceneSnapshot): void;
  load(): SceneSnapshot | null;
  clear(): void;
}
