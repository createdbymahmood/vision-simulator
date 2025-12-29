import type { StateCreator } from "zustand";

import { createZustandContextStore } from "@/components/shared/zustand";
import type { Scene } from "../core/scene-types";

interface SceneHistoryState {
  past: Scene[];
  future: Scene[];
}

interface SceneHistoryActions {
  captureSnapshot: (scene: Scene) => void;
  undo: (currentScene: Scene) => Scene | null;
  redo: (currentScene: Scene) => Scene | null;
  clearHistory: () => void;
}

export type SceneHistoryStore = SceneHistoryState & SceneHistoryActions;

function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene;
}

const createHistoryStore: (initial: {}) => StateCreator<SceneHistoryStore> =
  () =>
  (set, get) => ({
    past: [],
    future: [],
    captureSnapshot: (scene) =>
      set((state) => ({
        past: [...state.past, cloneScene(scene)],
        future: [],
      })),
    undo: (currentScene) => {
      const state = get();
      if (!state.past.length) {
        return null;
      }
      const previousScene = state.past[state.past.length - 1];
      set({
        past: state.past.slice(0, -1),
        future: [...state.future, cloneScene(currentScene)],
      });
      return previousScene;
    },
    redo: (currentScene) => {
      const state = get();
      if (!state.future.length) {
        return null;
      }
      const nextScene = state.future[state.future.length - 1];
      set({
        future: state.future.slice(0, -1),
        past: [...state.past, cloneScene(currentScene)],
      });
      return nextScene;
    },
    clearHistory: () =>
      set({
        past: [],
        future: [],
      }),
  });

export const sceneHistoryStore = createZustandContextStore<
  SceneHistoryStore,
  {}
>(createHistoryStore);

export const useSceneHistoryStore = sceneHistoryStore.useStore;

export const SceneHistoryProvider = sceneHistoryStore.Provider;

SceneHistoryProvider.displayName = "scene-history-provider";
