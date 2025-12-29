# 04 — History System & Scene Export

## Goal

Implement full undo/redo for all operations and scene export functionality.

---

## Deliverables

### 4.1 History System (Undo/Redo)

**Scope — Everything:**

- Creation and deletion of objects
- Movement and transform changes
- Property edits (with debounced commits — commit after 300ms idle to avoid history spam)
- Background changes
- Area creation/editing (Map)

**Implementation Requirements:**

- Command-based operations with `do()` and `undo()` methods
- Serializable diffs recommended
- History stack size default: 200 operations (configurable)
- Undo/Redo buttons in top panel
- Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)

### 4.2 Scene Export (JSON)

Export the complete scene to JSON file:

**Must Include:**

- All entities (walls, shapes, cameras, people, areas)
- Units (meters)
- Version number
- Mode (canvas or map)
- Background configuration (if any)
- Meta (createdAt, updatedAt)

**Must NOT Include:**

- Runtime caches
- Spatial indexes
- Compiled obstacle polygons
- Render targets

### 4.3 Scene Image Export

Export current canvas as top-down raster image:

- PNG format
- Captures the canvas view as seen in editor
- Optional: bundle export with assets (background image)

### 4.4 Export UI

- Export button in top panel with dropdown/popover:
  - Export Scene (JSON)
  - Export Image (PNG)
- File download triggers automatically

---

## Suggested Tools

- **immer** for immutable state updates in history
- **file-saver** or native download for file exports
- **html-to-image** or React Konva's `toDataURL` for image export

---

## Acceptance Criteria

- [ ] Undo works for: add/delete objects, move/resize/rotate, property edits, background changes
- [ ] Redo correctly restores undone operations
- [ ] Property edits are debounced (300ms) before committing to history
- [ ] History respects 200 operation limit
- [ ] Keyboard shortcuts work (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [ ] Scene JSON export contains all required fields
- [ ] Scene JSON does not contain runtime data
- [ ] Image export produces valid PNG of canvas

