# Phase 26: Preview 2D Top-Down View Switch + 2D Preview Mode (Plan Only)

**Timeline Reference**: Post-Phase 25 follow-up

---

## Phase Goal

Add a preview-only `2D top-down` mode and a `3D/2D` switch inside Preview while preserving current Preview behavior, scene fidelity, and side-panel tooling.

The 2D mode must keep the same feature surface as 3D Preview (recording, snapshots, area filtering, radar, camera feeds, entity selection) and differ only by camera projection/viewpoint (top-down).

---

## How Codex Should Use This Phase

- Do not implement features; this is **plan-only**.
- Reuse existing simulation architecture first; avoid building a second rendering/data pipeline.
- Keep current `editor` vs `preview` app flow and package mode contracts intact.
- Treat this phase as a Preview sub-mode extension, not a rewrite.

---

## Project-Wide Analysis Summary (Code + Existing Plans)

### Current view/mode ownership

- `App` resolves package `mode` and initializes UI state with mode policy in `src/app.tsx`.
- Package mode policies live in `src/features/scene/presentation/modes/vision-simulator-mode.ts`.
- Runtime view switching is controlled by `UiStore.viewMode` (`'editor' | 'preview'`) in `src/features/scene/infrastructure/stores/ui.store.ts`.
- `EditorLayout` gates editor vs preview rendering in `src/features/scene/presentation/components/editor-layout.tsx`.

### Current Preview implementation

- Preview shell is `SimulationAnalysisView` in `src/features/scene/presentation/components/simulation/simulation-analysis-view.tsx`.
- 3D canvas path is `SimulationCanvas` -> `SimulationScene` in:
  - `src/features/scene/presentation/components/simulation/simulation-canvas.tsx`
  - `src/features/scene/presentation/components/simulation/simulation-scene.tsx`
- Simulation scene already centralizes:
  - world generation from scene entities (`simulation-helpers.ts`)
  - simulated people (`use-simulated-people.ts`)
  - camera vision state (`camera-vision.ts`)
  - camera feed rendering (`use-camera-feed-renderers.ts`)
  - overlays and selection (`entity-meshes.tsx`, `camera-fov-footprints.tsx`)

### Why camera-projection reuse is preferred over MapView reuse

- `MapView` has rich 2D edit/draw interactions, but selection/transform logic is tied to edit mode and select tool (`use-selection-transform.ts`).
- Preview forces `isEditMode=false` in `EditorLayout`, so direct MapView reuse would lose current Preview selection behavior or require large interaction rewiring.
- 3D simulation has live movement and vision-state updates; keeping `SimulationScene` avoids duplicating simulation state into a second 2D runtime.

### Existing plan constraints to preserve

- No routing changes; view switching remains state-driven (`plans/01`, `plans/02`, `plans/22`).
- Preview mode locks must remain respected when package mode is `'preview'` (`plans/22`).
- Non-edit view/mode toggles must not create history entries (`plans/15`).
- 2D/3D collision and FOV logic should remain consistent across rendering surfaces (`plans/09.1`, `plans/23`).

---

## Scope & Responsibilities

### Included

- Add Preview sub-view state: `3D` vs `2D top-down`.
- Add switch UI in Preview for `3D/2D`.
- Implement top-down projection mode using the current simulation scene and entity pipeline.
- Preserve Preview feature parity across both sub-views.
- Define edge-case behavior and validation strategy.

### Explicitly Excluded

- Any backend/API changes.
- Any scene schema/entity contract changes.
- Replacing camera feed subsystem.
- New editing tools in Preview.
- Route changes or URL-driven mode.

---

## UX Contract (Target)

- Entering Preview still works exactly as now.
- Preview includes a `3D/2D` switch.
- `3D` keeps current behavior.
- `2D` shows the same simulation content from top-down with top-view controls.
- Both views keep:
  - area selector behavior
  - radar and camera feed side panels
  - snapshot export
  - recording
  - entity selection/focus affordance
- If package `mode='preview'` hides top bar, the switch must still be reachable via an in-viewport control.

---

## Architecture Strategy

### 1) Keep `viewMode` binary, add Preview sub-view state

- Keep `ViewMode = 'editor' | 'preview'` unchanged to avoid broad regressions.
- Add `PreviewViewMode = '3d' | '2d'` in UI store with:
  - `previewViewMode`
  - `setPreviewViewMode`
  - `togglePreviewViewMode`
- Default `previewViewMode` to `'3d'` to preserve current UX.

### 2) Extend mode policy, not ad-hoc checks

- Extend `VisionSimulatorModePolicy` to include Preview sub-view flags:
  - `defaultPreviewViewMode`
  - `allowPreviewViewSwitch`
- Ensure package-mode lock (`mode='preview'`) still blocks editor transitions while allowing 3D/2D switching in preview.

### 3) Reuse `SimulationAnalysisView` shell and panels

- Keep `SimulationAnalysisView` as the single Preview shell.
- Add the new switch there, pass `previewViewMode` down to scene/canvas.
- Keep `SimulationRadar`, `SimulationCameraSidebar`, area selector, recording, snapshot flows unchanged.

### 4) Reuse one simulation scene graph, swap camera rig behavior

- Keep a single `SimulationCanvas`/`SimulationScene` render path.
- Add camera rig behavior keyed by `previewViewMode`:
  - `3D`: existing perspective + orbit configuration.
  - `2D`: top-down orthographic (or fixed-top projection) with pan/zoom and rotation disabled.
- Preserve existing entity renderers (`EntitiesMesh`, `CameraFovFootprints`, `GroundPlane`, trails).

### 5) Keep selection/focus contract consistent

- Preserve current Preview selection behavior (click selects, double-click focus intent).
- In 2D, focus means center and fit/zoom to target bounds rather than changing tilt.
- Keep selection owned by `SceneStore.selectedEntityIds` so all panels remain in sync.

### 6) Keep capture/recording pipeline projection-safe

- Preserve `SimulationCaptureApi` usage for snapshot and recording.
- Update capture sizing logic in `SimulationScene` to handle orthographic projection safely (not only perspective aspect updates).
- Keep MediaRecorder path unchanged in `use-simulation-recording.ts`.

---

## Data/Type Contract Changes (Planned)

```ts
// ui.store.ts
export type PreviewViewMode = '3d' | '2d'

interface UiState {
  viewMode: ViewMode
  previewViewMode: PreviewViewMode
  setPreviewViewMode: (mode: PreviewViewMode) => PreviewViewMode
  togglePreviewViewMode: () => PreviewViewMode
}
```

```ts
// vision-simulator-mode.ts
interface VisionSimulatorModePolicy {
  initialViewMode: ViewMode
  lockViewMode: boolean
  showSimulationTopBar: boolean
  showSimulationAuxiliaryPanels: boolean
  allowSimulationBackToEditor: boolean
  defaultPreviewViewMode: PreviewViewMode
  allowPreviewViewSwitch: boolean
}
```

Rules:

- `viewMode` remains source of truth for editor/preview.
- `previewViewMode` is only meaningful when `viewMode === 'preview'`.
- Switching `previewViewMode` must not mutate scene data and must not create history entries.

---

## Implementation Workstreams

### Workstream A: State + Policy Wiring

- [ ] Add `PreviewViewMode` state/actions to `UiStore`.
- [ ] Initialize `previewViewMode` from mode policy at app/provider boundary.
- [ ] Extend mode policies with `defaultPreviewViewMode` and `allowPreviewViewSwitch`.
- [ ] Ensure `resetUi` and mode transitions preserve expected defaults.

### Workstream B: Preview Switch UI

- [ ] Add `3D/2D` switch control in `SimulationTopBar` using existing shadcn components already in repo.
- [ ] Render a fallback in-viewport switch when top bar is hidden by package mode policy.
- [ ] Disable/guard switch only when truly necessary (for example, during fatal capture errors), not by default.

### Workstream C: Scene Camera Rig for Top-Down Mode

- [ ] Add `previewViewMode` prop flow from `SimulationAnalysisView` to `SimulationScene`.
- [ ] Introduce a mode-aware camera rig abstraction in simulation components.
- [ ] Keep existing 3D controls unchanged when mode is `3d`.
- [ ] Add top-down pan/zoom behavior and lock rotation in `2d`.
- [ ] Preserve area-based initial framing and focus transitions in both modes.

### Workstream D: Selection, Focus, and Interaction Parity

- [ ] Keep mesh click selection working in 2D and 3D.
- [ ] Ensure double-click focus translates to center/fit in top-down mode.
- [ ] Keep `SceneStore.selectedEntityIds` sync untouched.
- [ ] Ensure no edit tools are activated by view switch actions.

### Workstream E: Snapshot/Recording Compatibility

- [ ] Update capture logic to support both perspective and orthographic cameras.
- [ ] Validate snapshot scale output for both modes.
- [ ] Validate MediaRecorder capture stream continuity when switching 3D/2D during preview.

### Workstream F: Performance + Lifecycle Safety

- [ ] Avoid remounting the entire `Canvas` when switching 3D/2D.
- [ ] Prevent unnecessary re-creation of feed renderers and simulation loops.
- [ ] Ensure cleanup for controls/camera refs on unmount or mode changes.

### Workstream G: Documentation

- [ ] Update `docs/user-guide.md` Preview section to describe 3D/2D switch behavior.
- [ ] Update `README.md` mode/preview notes to clarify Preview now supports two view projections.
- [ ] Add limitations note if any behavior intentionally differs (for example, 2D focus semantics).

---

## Edge-Case Matrix (Must-Have Behavior)

1. `mode='preview'` with hidden top bar.
Expected: user can still toggle 3D/2D via viewport-level control.

2. Empty/near-empty scene (no areas or entities).
Expected: both modes render stable fallback framing without crashes.

3. Multi-area scenes with active-area filter.
Expected: switching 3D/2D preserves active area and entity visibility rules.

4. Selection when not in edit mode.
Expected: Preview selection remains enabled in both 3D and 2D; editing stays disabled.

5. Double-click focus on thin walls/line shapes.
Expected: focus centers correctly and avoids extreme zoom jumps.

6. Recording active during view switch.
Expected: recording remains valid and downloadable; no recorder crashes.

7. Snapshot triggered immediately after view switch.
Expected: capture returns a valid image from the current projection.

8. Missing/invalid Mapbox token while map texture requested.
Expected: fallback texture behavior remains unchanged in both views.

9. Real-device camera tiles mixed with virtual tiles.
Expected: sidebar behavior remains unchanged; no coupling to preview projection mode.

10. Orthographic raycasting on dense scenes.
Expected: entity click targeting remains reliable and does not select unrelated hidden geometry.

11. Preview mode lock policies.
Expected: switching 3D/2D does not bypass `lockViewMode` editor restrictions.

12. History/undo stack integrity.
Expected: no history entries for 3D/2D switch.

13. Resize events and aspect changes.
Expected: camera projection matrices stay valid and do not stretch visuals.

14. Performance under many cameras/people.
Expected: no major FPS regression compared to current 3D preview baseline.

15. Frequent switch toggling.
Expected: no memory leaks, stale refs, or accumulated controls/listeners.

---

## File-Level Execution Map

- `src/features/scene/infrastructure/stores/ui.store.ts`
- `src/features/scene/presentation/modes/vision-simulator-mode.ts`
- `src/features/scene/presentation/components/simulation/simulation-analysis-view.tsx`
- `src/features/scene/presentation/components/simulation/simulation-top-bar.tsx`
- `src/features/scene/presentation/components/simulation/simulation-viewport.tsx`
- `src/features/scene/presentation/components/simulation/simulation-canvas.tsx`
- `src/features/scene/presentation/components/simulation/simulation-scene.tsx`
- `src/features/scene/presentation/components/simulation/simulation-capture.ts` (if contract changes needed)
- `docs/user-guide.md`
- `README.md`

Optional new files (only if needed to keep components small/cohesive):

- `src/features/scene/presentation/components/simulation/simulation-preview-view-switch.tsx`
- `src/features/scene/presentation/components/simulation/simulation-camera-rig.tsx`

---

## Execution Sequence (PR Slices)

### PR-1: Store + Policy Contracts

Scope:

- Add `previewViewMode` state/actions.
- Extend mode policy with preview sub-view flags.
- Wire provider initialization defaults.

Gate:

- App behavior unchanged when using default `3d` preview sub-view.

### PR-2: Preview Switch UI + Shell Wiring

Scope:

- Add switch control in top bar.
- Add fallback switch when top bar hidden.
- Pass `previewViewMode` through preview shell to canvas/scene.

Gate:

- User can switch 3D/2D in both normal preview and forced preview package mode.

### PR-3: Camera Rig + Top-Down Projection

Scope:

- Implement mode-aware camera/control rig in simulation scene.
- Keep same entity rendering and side-panel data flows.
- Ensure selection/focus parity.

Gate:

- 2D top-down behaves as preview projection change, not a new simulation stack.

### PR-4: Capture/Recording Hardening + QA

Scope:

- Projection-safe snapshot capture.
- Recording validation in both views.
- Edge-case QA matrix execution and fixes.

Gate:

- Snapshot/recording stable for both 3D and 2D preview modes.

### PR-5: Docs Closeout

Scope:

- Update README and user guide.
- Document behavior and constraints.

Gate:

- Documentation reflects shipped Preview 3D/2D behavior and mode-policy implications.

---

## Acceptance Checklist

- [ ] Preview includes a clear 3D/2D switch.
- [ ] 2D mode is top-down and uses the same simulation data/feature surface as 3D.
- [ ] Editor/Preview global mode flow remains unchanged and no routing is introduced.
- [ ] Package `mode='preview'` lock behavior remains intact.
- [ ] Side panels (radar/camera feeds), area filter, selection, recording, and snapshots work in both views.
- [ ] No history entries are created by preview projection switching.
- [ ] Performance and lifecycle remain stable under repeated switching.
- [ ] Documentation is updated.

---

## Risks & Mitigations

1. Risk: orthographic camera integration breaks capture or aspect handling.
Mitigation: isolate camera rig logic and add projection-specific capture update paths.

2. Risk: view switch remounts canvas and resets simulation/feed resources.
Mitigation: keep one canvas instance and switch projection/control behavior in-place.

3. Risk: selection hit-testing degrades in top-down mode on dense geometry.
Mitigation: validate raycasting thresholds and focus/selection behavior with a dense-scene matrix.

4. Risk: forced preview mode hides all controls including new switch.
Mitigation: add policy-aware fallback switch in viewport overlay.

5. Risk: parity promise drifts between 3D and 2D.
Mitigation: define explicit parity checklist and require QA sign-off per feature.
