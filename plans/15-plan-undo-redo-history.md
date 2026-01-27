# Phase 15: Undo/Redo History System

**Timeline Reference**: Post-Phase 14 follow-up

---

## Phase Goal

Deliver a complete, user-facing undo/redo system that captures **all editor mutations** with clear history descriptions, proper debouncing, keyboard shortcuts, and correct UI states. This phase scopes undo/redo into its own implementation track and removes behavioral dependencies from earlier phases.

---

## How Codex Should Use This Phase

- Treat this as a **dedicated history workflow**: isolate undo/redo from UI layout work.
- Use existing infrastructure as the foundation:
  - `history.store.ts` (past/future stacks, capacity, clone)
  - `EditorLayout` undo/redo handlers
  - Top Panel undo/redo buttons
  - `useEditorShortcuts` (`⌘Z`/`⌘⇧Z` handlers already present)
- Replace implicit “record on every change” behavior with **explicit, operation-based history entries**.
- Ensure history entries include meaningful descriptions for tooltip/UI.
- Undo/redo must never break selection, tool states, or interaction correctness.

---

## Scope & Responsibilities

### Included

- History entry recording for **all edit operations** (draw, place, delete, move, resize, rotate, property changes)
- Consistent history descriptions (e.g., “Add Area”, “Move Camera”, “Update Wall”, “Delete Shapes”)
- Undo/redo button wiring (disabled states, tooltip text, last action)
- Keyboard shortcuts for undo/redo (with proper mode gating)
- Debounce/merge logic for continuous actions (dragging, sliders)
- Clear/reset behavior for history when scene is reset or replaced

### Explicitly Excluded

- UI layout changes (buttons already exist)
- New editor tools
- Any changes to Canvas Mode behavior

---

## Deliverables

### 1) History API & Data Model

- [ ] Keep `HistoryEntry` shape (scene + description + timestamp)
- [ ] Centralize history recording behind a single API (e.g., `recordHistory(action, scene)`)
- [ ] Capacity respected (default 100, configurable)
- [ ] History entries are **never persisted** to local storage

### 2) What Gets Recorded

- [ ] **Create operations**: area, wall, shape, camera, person
- [ ] **Update operations**: move/resize/rotate, PTZ changes, property edits
- [ ] **Delete operations**: single or multi-select delete
- [ ] **Style changes** that affect the scene (e.g., map style, map visibility)
- [ ] **Clear board** should wipe history and reset to a clean state

> Non-edit UI changes (selection-only, view mode switch, preview mode, popovers) must not create history entries.

### 3) Recording Strategy

- [ ] Replace “record on every scene change” with **operation-based** history commits
- [ ] For continuous gestures, record a single entry on **gesture end**
- [ ] Debounce rapid updates (e.g., 300ms for sliders) and merge into one entry
- [ ] Avoid recording when applying undo/redo (guard flag)

### 4) Undo/Redo Behavior

- [ ] Undo pops from `past`, pushes current scene to `future`, applies previous scene
- [ ] Redo pops from `future`, pushes current scene to `past`, applies next scene
- [ ] If the current selection references missing entities after undo/redo, clear selection
- [ ] Map tools, overlays, and drawing state remain functional after history changes

### 5) UI & Shortcuts

- [ ] Undo/Redo buttons enabled/disabled from history store state
- [ ] Tooltip shows last action description (`Undo (Add Camera)`, `Redo (Resize Area)`)
- [ ] `⌘Z` / `Ctrl+Z` triggers Undo; `⌘⇧Z` / `Ctrl+Shift+Z` triggers Redo
- [ ] Shortcuts disabled in preview mode and when edit mode is off
- [ ] Shortcuts ignored when focus is inside text inputs or editable fields

### 6) Tests / Verification

- [ ] Unit tests for history store: record, undo, redo, capacity, clear
- [ ] Integration checks for core flows:
  - Create → undo → redo
  - Drag → undo → redo
  - Property change → undo → redo
  - Delete → undo → redo
  - Clear board resets history

---

## Dependencies

- Phase 2: Editor Layout & UI Framework (Undo/Redo buttons exist)
- Phase 3–8: All editing operations and properties UI are present
- Phase 14: Map style switching (style change must be captured in history)

---

## Acceptance Checklist

- [ ] Undo/redo works for every edit operation in the editor
- [ ] History entries use clear, user-facing descriptions
- [ ] Buttons and shortcuts reflect correct enabled/disabled states
- [ ] Undo/redo never crashes or leaves invalid selections
- [ ] No history entries are created by non-edit UI actions
- [ ] History resets on scene clear or replace

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Excess history noise from rapid changes | Gesture-end commits + debounce/merge |
| Memory usage from large scenes | Capacity cap + clone strategy |
| Invalid selection after undo | Auto-clear selection on mismatch |
| Accidental history during undo/redo | Guard flag when applying history |

---

## Mapping to PRD Sections

- Section 3.3: Interaction Categories → History operations
- Section 5.1.1: Top Panel → Undo/Redo controls
- Section 6: Editing behaviors → Drag/resize/rotate history commits
