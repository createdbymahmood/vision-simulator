# Phase 31: Simulation Full-Page Camera Grid View (Plan Only)

**Timeline Reference**: Post-Phase 30 follow-up

---

## Phase Goal

Add a Simulation-mode view that can be triggered to show **all camera feeds in a full-page grid**. Each grid tile must still support the **existing full-screen feed behavior** (same as current per-feed full-screen).

This is a plan-only phase. No implementation is performed here.

---

## How Codex Should Use This Phase

- Plan only. Do not implement.
- Treat this as a **Simulation sub-view** (not a new route, not a new page).
- Reuse the existing camera feed rendering pipeline and full-screen feed behavior.
- Switching into/out of grid view must not mutate scene data or create history entries.
- Maintain package mode policies (preview/editor locking) and Simulation UI structure.

---

## Scope & Responsibilities

### Included

- A new Simulation sub-view: `camera grid` (full-page camera feeds).
- A trigger/control to enter/exit grid view in Simulation.
- Layout controls for grid density (2x2, 3x3, 4x4) consistent with existing feed grid rules.
- Full-screen behavior for any feed tile, using the same mechanism as current per-feed full-screen.
- UX rules for empty camera sets and mismatched grid sizes.

### Explicitly Excluded

- New camera rendering pipelines or data sources.
- Any changes to scene schema or entity models.
- Routing changes or URL-driven mode switches.
- Any new recording/snapshot features beyond what already exists.

---

## UX Contract (Target)

- Simulation mode gets a **"Camera Grid"** toggle that swaps the primary viewport to a full-page grid of camera feeds.
- The grid view replaces the 3D canvas while active.
- Each grid tile has the **same per-feed full-screen action** that exists today.
- Exiting full-screen returns to the grid view (not the 3D view).
- Exiting grid view returns to the Simulation scene as it was (selection and panels preserved).

---

## Architecture Strategy

### 1) Add a Simulation sub-view state

- Keep existing `ViewMode = 'editor' | 'preview'`.
- Add a dedicated Simulation sub-view state for preview/simulation-only layout:
  - `simulationViewMode: 'scene' | 'cameraGrid'`.
- Default `simulationViewMode` to `'scene'` to preserve current UX.

### 2) Extend mode policy without branching UI logic

- Extend mode policy with flags:
  - `allowSimulationCameraGrid`
  - `defaultSimulationViewMode`
- Use policy to gate visibility and default for package `mode='preview'`.

### 3) Reuse camera feed renderer pipeline

- Camera feeds in grid view should reuse existing feed render targets and detection overlays.
- Avoid new render loops; reuse `use-camera-feed-renderers` (or equivalent).

### 4) Full-screen behavior remains canonical

- The full-screen feed logic should be a single shared path used in both sidebar feeds and grid view.
- Entering full-screen in grid view should **not** change layout state; it is an overlay or modal on top of grid.

### 5) Preserve UI/panel behavior

- Grid view should not break the Simulation top bar, radar, or sidebar presence unless policy says to hide.
- If the top bar is hidden by policy, provide an in-viewport control to exit grid view.

---

## Data/Type Contract Changes (Planned)

```ts
// ui.store.ts
export type SimulationViewMode = 'scene' | 'cameraGrid'

interface UiState {
  simulationViewMode: SimulationViewMode
  setSimulationViewMode: (mode: SimulationViewMode) => SimulationViewMode
  toggleSimulationViewMode: () => SimulationViewMode
}
```

```ts
// vision-simulator-mode.ts
interface VisionSimulatorModePolicy {
  defaultSimulationViewMode: SimulationViewMode
  allowSimulationCameraGrid: boolean
}
```

Rules:

- `simulationViewMode` only applies when `viewMode === 'preview'`.
- Switching `simulationViewMode` must not create history entries.

---

## Implementation Workstreams

### Workstream A: Store + Policy Wiring

- [ ] Add `SimulationViewMode` state/actions to `UiStore`.
- [ ] Initialize `simulationViewMode` from mode policy.
- [ ] Extend mode policies with defaults and feature flag for grid view.

### Workstream B: Entry/Exit Controls

- [ ] Add a "Camera Grid" toggle in Simulation top bar.
- [ ] Add in-viewport exit control when top bar is hidden.
- [ ] Ensure keyboard escape exits full-screen first, then grid view.

### Workstream C: Camera Grid View Container

- [ ] Create a full-page grid component that mounts in place of the Simulation canvas.
- [ ] Wire grid sizing controls (2x2, 3x3, 4x4) using existing feed grid rules.
- [ ] Display placeholders when cameras < grid slots.

### Workstream D: Full-Screen Feed Integration

- [ ] Reuse current full-screen feed mechanism for grid tiles.
- [ ] Ensure return path is grid view, not the 3D scene.

### Workstream E: State Preservation + UX Parity

- [ ] Preserve selected entity state and sidebar context while switching views.
- [ ] Validate that radar and other overlays behave consistently.

---

## Edge-Case Matrix (Must-Have Behavior)

1. No cameras in scene
Expected: grid view shows empty state and exit control.

2. One camera with 3x3 grid
Expected: 1 live tile + 8 placeholders, no layout break.

3. Full-screen from grid view then exit
Expected: returns to grid view with same grid size.

4. Top bar hidden by policy
Expected: in-viewport control still allows exiting grid view.

5. Switching view while recording
Expected: recording continues without crash; output remains valid.

6. Rapid toggling between scene and grid
Expected: no leaks, no stale render targets.

---

## File-Level Execution Map

- `src/features/scene/infrastructure/stores/ui.store.ts`
- `src/features/scene/presentation/modes/vision-simulator-mode.ts`
- `src/features/scene/presentation/components/simulation/simulation-analysis-view.tsx`
- `src/features/scene/presentation/components/simulation/simulation-top-bar.tsx`
- `src/features/scene/presentation/components/simulation/simulation-camera-sidebar.tsx`
- `src/features/scene/presentation/components/simulation/simulation-camera-grid-view.tsx` (new)
- `src/features/scene/presentation/components/simulation/simulation-feed-fullscreen.tsx` (existing or new wrapper)

---

## Execution Sequence (PR Slices)

### PR-1: Store + Policy Contracts

Scope:

- Add `simulationViewMode` state/actions.
- Extend policy defaults and allow flag.

Gate:

- Default UX unchanged; grid view disabled unless policy allows.

### PR-2: Grid View Shell + Controls

Scope:

- Add camera grid view container.
- Add toggle controls and exit handling.

Gate:

- User can switch scene <-> grid view without errors.

### PR-3: Full-Screen Integration + QA

Scope:

- Wire full-screen feed behavior to grid tiles.
- Run edge-case matrix checks.

Gate:

- Full-screen works exactly as current behavior, returning to grid view.

---

## Acceptance Checklist

- [ ] Simulation includes a toggle that enters a full-page camera grid view.
- [ ] Grid view uses existing camera feed rendering and detection overlays.
- [ ] Any grid tile can be expanded to full-screen using the current behavior.
- [ ] Exiting full-screen returns to grid view (not the 3D scene).
- [ ] Exiting grid view returns to the simulation scene without losing selection or panel state.
- [ ] No history entries are created by switching view modes.
- [ ] Mode policy can disable grid view when required.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Grid view duplicates feed renderers | Reuse existing feed renderer hook and render targets |
| Full-screen path diverges from existing behavior | Consolidate full-screen logic into a single shared component |
| Policy-hidden top bar blocks exit | Provide an in-viewport exit control |
| Performance drop with many tiles | Cap active feeds based on grid size; degrade resolution if needed |

---

## Mapping to PRD / Plans

- Extends Phase 11 (Camera POV feeds) with a dedicated full-page grid view for Simulation.
- Must remain compatible with existing Simulation mode policies (Phase 22).
