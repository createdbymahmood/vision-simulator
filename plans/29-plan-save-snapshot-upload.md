# Phase 29: Save-Time Working Canvas Snapshot Upload

**Timeline Reference**: Post-Phase 28 follow-up

---

## Phase Goal

When the user clicks Save, generate a screenshot of the current working canvas, upload it through `uploadFile`, and persist `response.fileKey` into `VisionUpdateDto.snapshot` in the same save operation.

The screenshot must always include the active area in frame and must preserve the correct background by mode:

- Canvas mode: include the existing grid background.
- Map mode: include map background using exact style `mapbox://styles/mapbox/light-v11`.

---

## Requirements Locked For This Phase

1. Save button path must execute snapshot capture and upload before `updateVision`.
2. Upload must use `uploadFile` from:
   - `src/data-provider/api/services/v2/file.ts`
3. Snapshot field must be set using:
   - `VisionUpdateDto.snapshot = response.fileKey`
4. Active area must fit in the generated screenshot.
5. Map-mode screenshot background must use:
   - `mapbox://styles/mapbox/light-v11`
6. Canvas-mode screenshot must include current grid background (existing Mapbox grid style behavior).

---

## Current Baseline (Observed)

- Save flow currently is:
  - `TopPanel.onSave` -> `EditorLayout.handleSave` -> `useEditorUnsavedChangesGuard.saveScene` -> `updateVision(...)`.
- `updateVision` payload currently sends `vision.data` only, without `snapshot`.
- `MapView` already has `preserveDrawingBuffer` enabled and reports `MapRef` back to `EditorLayout`.
- `MapView` styling currently is:
  - Canvas mode: `getCanvasGridStyle()`
  - Map mode: one of `street | satellite | traffic | osm`
- No current usage of `Vision.snapshot` in scene save pipeline.

---

## Target Save Pipeline

1. User clicks Save.
2. Save action requests a capture from current editor map/canvas view.
3. Capture routine:
   - resolves target area bounds (active area first),
   - applies capture style by mode,
   - fits bounds so active area is inside frame,
   - captures PNG blob from map canvas,
   - restores pre-capture viewport/style.
4. Save action uploads PNG with `uploadFile({file})`.
5. Save action validates `response.fileKey`.
6. Save action calls `updateVision(visionSimulatorId, {vision: {data: scene}, snapshot: fileKey})`.
7. Save success behavior remains unchanged (`markSaved`, success toast).

---

## Detailed Implementation Plan

### Workstream A: Add Snapshot Capture Boundary

- [ ] Introduce a dedicated capture utility (new presentation utility file) to keep map-specific logic out of save orchestration.
- [ ] Utility input contract should include:
  - `mapRef: MapRef | null`
  - `scene: SceneRoot`
  - `editorMode: EditorMode`
  - `mapVisible: boolean`
- [ ] Utility output:
  - `Promise<Blob>` (PNG blob), throws on failure.

### Workstream B: Active Area Fit Logic

- [ ] Determine target area for framing:
  - primary: `scene.activeAreaId`
  - fallback: first area in `scene.areas` when active is missing
  - no-area fallback: capture current viewport as-is
- [ ] Reuse existing bounds logic (`computeBounds`) to create fit target.
- [ ] Fit map before capture with non-animated fit (duration `0`) and stable padding (recommended `80`).
- [ ] Wait for render stability (`idle` + one animation frame) before reading canvas.

### Workstream C: Mode-Specific Background Rules

- [ ] Canvas mode capture style:
  - keep/use current grid style (`getCanvasGridStyle`) so grid is visible.
- [ ] Map mode capture style:
  - force temporary style to `mapbox://styles/mapbox/light-v11` for capture.
- [ ] Guarantee style change is temporary for capture only:
  - do not persist `light-v11` into `scene.meta.mapStyle`.
- [ ] Restore user viewport/style immediately after capture.

### Workstream D: Save Hook Integration

- [ ] Extend `useEditorUnsavedChangesGuard` params with a capture callback from `EditorLayout`.
- [ ] In `saveScene`, update operation order to:
  1. capture blob
  2. create file (`createSnapshotFilename`)
  3. `uploadFile({file})`
  4. extract and validate `fileKey`
  5. `updateVision` with both `vision` and `snapshot`
- [ ] Keep existing `isSavingRef` guard and loading semantics.

### Workstream E: Error Handling and UX

- [ ] Define failure policy: snapshot generation/upload failure aborts save (no partial `updateVision`).
- [ ] Surface clear toasts:
  - snapshot unavailable,
  - upload failed,
  - snapshot fileKey missing.
- [ ] Ensure failure keeps dirty state unchanged.

### Workstream F: Verification and Regression Coverage

- [ ] Validate Save button path in both `map` and `canvas` editor modes.
- [ ] Validate unsaved-changes "Save and leave" still works (shared save path).
- [ ] Validate no unintended updates to stored scene map style.

---

## Suggested File Targets

- `src/features/scene/presentation/hooks/use-editor-unsaved-changes-guard.ts`
- `src/features/scene/presentation/components/editor-layout.tsx`
- `src/features/scene/presentation/components/map-view/map-view.tsx` (only if small capture-style hooks/props are required)
- `src/features/scene/presentation/components/map-view/selection-geometry.ts` (reuse only, avoid duplication)
- `src/features/scene/presentation/utils/scene-export.ts` (reuse existing filename helper)
- `src/features/scene/presentation/utils/` (new snapshot capture utility file)
- `src/data-provider/api/services/v2/file.ts` (reuse existing action; no generated-file edits expected)

---

## Acceptance Checklist

- [ ] Clicking Save captures current working canvas snapshot before `updateVision`.
- [ ] Snapshot upload uses `uploadFile` from `src/data-provider/api/services/v2/file.ts`.
- [ ] `VisionUpdateDto.snapshot` is set from `response.fileKey`.
- [ ] Active area fits in the generated snapshot.
- [ ] Canvas mode snapshot includes grid background.
- [ ] Map mode snapshot includes map background with style `mapbox://styles/mapbox/light-v11`.
- [ ] Existing scene save (`vision.data`) still persists correctly.
- [ ] Save prevents duplicate concurrent executions.

---

## Validation Matrix

1. Canvas Mode Save
- [ ] Switch to canvas mode, click Save, verify uploaded snapshot shows grid background.
- [ ] Verify active area is fully visible in snapshot frame.

2. Map Mode Save
- [ ] Switch to map mode, click Save, verify uploaded snapshot uses `light-v11`.
- [ ] Verify active area is fully visible in snapshot frame.

3. Payload Integrity
- [ ] Verify outgoing PATCH includes both:
  - `vision.data`
  - `snapshot` (non-empty file key)

4. Failure Behavior
- [ ] Force upload failure and confirm save aborts with error toast.
- [ ] Confirm dirty state remains dirty after failed save.

5. Non-Regression
- [ ] Confirm user-selected scene map style is unchanged after save.
- [ ] Confirm save-and-leave path still works.

---

## Risks and Mitigations

1. Risk: Temporary style swap causes visual flicker.
Mitigation: perform fast non-animated capture steps and immediate restore, keep save button loading during capture.

2. Risk: Style/image load race creates blank or partially rendered capture.
Mitigation: wait for style/idle readiness before calling canvas capture.

3. Risk: `fileKey` missing from upload response.
Mitigation: explicitly validate response and fail save if absent.

4. Risk: No active area exists.
Mitigation: fallback to first area; if no areas exist, capture current viewport and continue.

---

## Execution Sequence (PR Slices)

### PR-1: Capture Utility + Fit/Style Restore
Scope:
- capture helper with area fitting, mode style selection, and viewport/style restoration.

### PR-2: Save Pipeline Integration
Scope:
- wire capture + upload into `saveScene`, include `snapshot` in `updateVision` payload.

### PR-3: Hardening + QA Pass
Scope:
- edge-case handling, toasts, manual validation matrix completion.
