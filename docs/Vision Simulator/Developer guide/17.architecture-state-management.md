# State Management

## Stores
- `state/scene.store.ts`: scene data, entities, selection, and edits
- `state/ui.store.ts`: tool state, view modes, UI panel visibility, runtime toggles
- `state/history.store.ts`: undo/redo stacks

## History
History actions live in `state/history-actions.ts`. The history store is seeded on load and records scene snapshots to support undo/redo.

## Usage Pattern
Components subscribe to stores with selectors and update state through store actions. Avoid direct mutations; always use store methods to keep history and dirty-state tracking consistent.
