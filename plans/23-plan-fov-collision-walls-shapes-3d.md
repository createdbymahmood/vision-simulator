# Phase 23: 3D FOV Collision Rendering for Walls + Shapes (Implementation Mode)

**Timeline Reference**: Post-Phase 22 follow-up

---

## Implementation Goal

Implement and ship 3D FOV collision surfaces for both **walls** and **shapes** in Live Preview, aligned with PRD Section 5.4 and the current scene architecture, while preserving wall base color fidelity.

Execution mode is active: this document now defines **build order**, **PR slices**, and **validation gates**.

---

## Implementation Rules

- Treat this as scoped completion of existing 3D collision work, not a net-new subsystem.
- Reuse existing geometry/visibility pipelines; do not introduce a second collision engine.
- Keep wall base materials color-stable; collision visuals are overlays only.
- Respect existing domain contracts (`CameraEntity.showCollisions`, scene entities, area scoping).
- Merge only after each PR slice meets its validation gate.

---

## Project-Wide Analysis Summary (Plans + Code)

### Plan/PRD alignment reviewed

- `plan.md` Section 5.4 requires 3D FOV collision rendering for walls/shapes, with collision toggles.
- `plans/10-plan-3d-advanced-features.md` defines wall/shape/floor collision surfaces and performance expectations.
- `plans/09.1-plan-fov-wedge-shapes-collision.md` already defines 2D occlusion behavior and height-aware logic.

### Current implementation state reviewed

- 3D floor FOV footprint exists and is occlusion-aware via:
  - `src/features/scene/presentation/components/simulation/camera-fov-footprints.tsx`
  - `src/features/scene/presentation/components/map-view/map-view-helpers.ts`
- 3D collision surface pipeline exists but is incomplete for wall+shape parity:
  - `src/features/scene/presentation/components/simulation/camera-collision-surfaces.tsx`
  - `src/features/scene/presentation/components/simulation/camera-collision-wall.tsx`
  - `src/features/scene/presentation/components/simulation/camera-collision-shape.tsx`
- `CameraEntity.showCollisions` exists in domain but is not fully wired into 3D rendering gates.
- Global collision visibility toggle from PRD is not currently exposed in 3D top controls.

---

## Scope & Responsibilities

### Included

- Plan to restore/guarantee wall + shape collision surfaces in 3D preview.
- Plan to wire global and per-camera collision visibility controls.
- Plan to define stable visual rules (opacity, blending, layering, no base-wall tint side effects).
- Plan to add verification strategy (manual + automated where feasible).

### Explicitly Excluded

- Physics/people steering redesign.
- Radar redesign.
- Camera feed realism changes unrelated to collision overlays.
- Any scene schema change beyond already existing `showCollisions` usage.

---

## Definition of Done (Feature Level)

- In 3D preview, each camera can render collision overlays on **both** walls and shapes within its area.
- Collision overlays update when camera PTZ/FOV/depth changes or when walls/shapes change.
- Global collision toggle can hide/show all collision overlays.
- Per-camera `showCollisions` can hide/show overlays for that camera.
- Wall base color remains exactly as configured; collision overlays do not cause perceived wall color animation or whitening.

---

## Architecture Strategy

### 1) Single Collision Visibility Policy

- Create one decision path for visibility gating:
  - Global toggle (UI store)
  - Per-camera `showCollisions`
  - Area match and entity eligibility
- Apply this policy before creating any collision mesh.

### 2) Keep 2D Occlusion and 3D Collision Responsibilities Separate

- Keep `buildOccludedFovRing` pipeline for ground footprint.
- Keep frustum-plane clipping pipeline for 3D obstacle surfaces.
- Share only reusable math/config utilities; avoid merging responsibilities into one monolithic function.

### 3) Wall + Shape Parity Contract

- Define a common collision render contract for walls and shapes (color/opacity/layer/render order/clipping behavior).
- Ensure walls and shapes follow the same camera filtering rules and update cadence.

### 4) Visual Stability Rules

- Collision overlays are overlays only; no mutation of base obstacle material.
- Default collision overlay behavior is stable and non-distracting.
- Any pulse/glow behavior must be optional and controlled, not implicit.

### 5) Layering and Render Discipline

- Keep collision surfaces in debug/overlay layering with explicit `renderOrder` and `depthWrite` behavior.
- Prevent z-fighting using polygon offset policy shared across wall/shape overlays.

### 6) Performance Guardrails

- Recompute/copy only when dependencies change (camera transform, FOV params, obstacle geometry).
- Use memoization for per-area obstacle subsets and camera-to-area mapping.
- Define fallback throttling policy for heavy scenes.

---

## Implementation Workstreams

### Workstream A: Collision Visibility Controls

- [ ] Add global `showFovCollisions` UI state (default `true`).
- [ ] Add preview top-bar toggle to control global collision visibility.
- [ ] Wire per-camera `showCollisions` control in camera properties.
- [ ] Enforce precedence: global OFF overrides per-camera ON.

### Workstream B: 3D Rendering for Walls + Shapes

- [ ] Restore/guarantee wall collision rendering path in `CameraCollisionSurfaces`.
- [ ] Keep shape collision rendering and align behavior with walls.
- [ ] Use camera-color overlays while preserving obstacle base materials.
- [ ] Apply identical area and camera filtering rules to both entity types.

### Workstream C: Height/Occlusion Rules

- [ ] Implement full vs partial collision opacity matrix based on camera height vs obstacle height.
- [ ] Keep line-shape thickness handling explicit and consistent.
- [ ] Confirm area boundary behavior through existing area obstacle path.

### Workstream D: Scene Integration

- [ ] Update `simulation-scene` so collision overlays mount conditionally via visibility policy.
- [ ] Update UI store for global toggle state and persistence behavior.
- [ ] Update preview controls and camera properties for collision control discoverability.

### Workstream E: Performance

- [ ] Define and apply memoization keys for collision dependencies.
- [ ] Define recompute vs reuse policy for collision overlay geometry.
- [ ] Validate stress target and acceptable FPS in collision-on mode.

### Workstream F: Validation & QA

- [ ] Run scenario matrix: wall-only, shape-only, mixed, multi-camera.
- [ ] Verify toggle matrix: global ON/OFF × per-camera ON/OFF.
- [ ] Verify regression: wall base color remains stable with collisions visible.
- [ ] Verify update triggers: PTZ, FOV, depth, wall edit, shape edit, area change.

### Workstream G: Documentation

- [ ] Update user guide preview section with collision toggle behavior.
- [ ] Add developer note for collision pipeline boundaries (footprint vs 3D overlays).

---

## Execution Sequence (PR Slices)

### PR-1: Visibility State + UI Wiring

Scope:
- Global collision toggle state in UI store.
- Preview top-bar toggle.
- Camera property control wiring for `showCollisions`.

Primary files:
- `src/features/scene/infrastructure/stores/ui.store.ts`
- `src/features/scene/presentation/components/simulation/simulation-top-bar.tsx`
- `src/features/scene/presentation/components/properties-sheet/camera-properties-sheet.tsx`
- `src/features/scene/presentation/components/simulation/simulation-analysis-view.tsx`

Gate:
- Global/per-camera visibility can be toggled without rendering regressions.

### PR-2: Wall + Shape Collision Rendering Parity

Scope:
- Ensure wall and shape collision surfaces are both rendered under same gating policy.
- Ensure area filtering and per-camera filtering are consistent.

Primary files:
- `src/features/scene/presentation/components/simulation/camera-collision-surfaces.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-wall.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-shape.tsx`

Gate:
- Wall and shape collisions are both visible when enabled and hidden when disabled.

### PR-3: Height Rules + Visual Stability

Scope:
- Implement/confirm full vs partial opacity behavior.
- Ensure overlays do not alter base wall material appearance.
- Remove implicit pulse unless explicitly enabled by spec flag.

Primary files:
- `src/features/scene/presentation/components/simulation/camera-collision-wall.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-shape.tsx`
- `src/features/scene/presentation/components/simulation/entity-meshes.tsx`

Gate:
- Collision overlays render with expected intensity and no wall color drift.

### PR-4: Performance Pass

Scope:
- Memoization and recompute boundaries.
- Update throttling strategy for heavy scenes if needed.

Primary files:
- `src/features/scene/presentation/components/simulation/simulation-scene.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-surfaces.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-utils.ts`

Gate:
- No major FPS regression in multi-camera mixed-obstacle scenes.

### PR-5: QA + Docs Closeout

Scope:
- QA matrix execution and evidence capture.
- User/developer docs updates.

Primary files:
- `docs/user-guide.md`
- `docs/known-limitations.md` (if applicable)

Gate:
- All acceptance checklist items verified and documented.

---

## File-Level Execution Map

- `src/features/scene/presentation/components/simulation/simulation-scene.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-surfaces.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-wall.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-shape.tsx`
- `src/features/scene/presentation/components/simulation/camera-collision-utils.ts`
- `src/features/scene/presentation/components/simulation/simulation-top-bar.tsx`
- `src/features/scene/presentation/components/properties-sheet/camera-properties-sheet.tsx`
- `src/features/scene/infrastructure/stores/ui.store.ts`

---

## Acceptance Checklist (Release Gate)

- [ ] Plan explicitly covers rendering collisions for both walls and shapes in 3D mode.
- [ ] Plan includes both global and per-camera collision toggles.
- [ ] Plan protects wall base color fidelity while overlays are active.
- [ ] Plan defines height-aware collision rendering behavior.
- [ ] Plan includes performance and QA validation strategy.

---

## Risks & Mitigations

- **Risk**: Overlay rendering causes perceived wall color drift.
  - **Mitigation**: Keep collision overlays independent from wall base material; verify with side-by-side checks.
- **Risk**: Collision toggles become inconsistent across UI and renderer.
  - **Mitigation**: Single visibility policy function consumed by scene and controls.
- **Risk**: Performance drops in multi-camera scenes.
  - **Mitigation**: Memoization, update gating, optional throttling.

---

## Mapping to PRD Sections

- `plan.md` Section 5.4.1: Collision surfaces on walls/shapes/floor
- `plan.md` Section 5.4.2: Height-aware collision rules
- `plan.md` Section 5.4.3: Collision rendering performance constraints
- `plan.md` Section 5.4.4: Global + per-camera collision visualization controls
- `plan.md` Section 9: QA acceptance for 3D FOV collision rendering
