import type { SceneSnapshot } from "../core/types";
import type { ScenePersistencePort } from "../ports/scene-persistence";

const KEY = "cv-simulator-scene";

export function makeLocalScenePersistence(): ScenePersistencePort {
  return {
    save(snapshot) {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.error("Failed to persist scene", error);
      }
    },
    load() {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as SceneSnapshot;
      } catch (error) {
        console.error("Failed to parse scene", error);
        return null;
      }
    },
    clear() {
      if (typeof window === "undefined") return;
      localStorage.removeItem(KEY);
    },
  };
}
