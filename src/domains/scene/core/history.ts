import type { HistoryCommand, SceneState } from "./types";

function trimHistory(state: SceneState) {
  if (state.history.undoStack.length > state.history.limit) {
    state.history.undoStack = state.history.undoStack.slice(-state.history.limit);
  }
}

export function applyCommand(state: SceneState, command: HistoryCommand) {
  command.redo(state);
  state.history.undoStack.push(command);
  state.history.redoStack = [];
  trimHistory(state);
  state.meta.updatedAt = new Date().toISOString();
}

export function undo(state: SceneState) {
  const command = state.history.undoStack.pop();
  if (!command) return;
  command.undo(state);
  state.history.redoStack.push(command);
  state.meta.updatedAt = new Date().toISOString();
}

export function redo(state: SceneState) {
  const command = state.history.redoStack.pop();
  if (!command) return;
  command.redo(state);
  state.history.undoStack.push(command);
  state.meta.updatedAt = new Date().toISOString();
}
