# Phase 28: Real Radar Data Abstraction + 3D Live Detections

**Timeline Reference**: Post-Phase 27 follow-up

---

## Phase Goal

Refactor the real radar implementation so data retrieval is abstracted out of `simulation-real-radar.tsx`, reduce component size by extracting responsibilities, and introduce realistic live 3D detection entities (people, cars, etc.) in preview mode using real-device socket data with accurate geospatial placement.

---

## How Codex Should Use This Phase

- Preserve current radar behavior while refactoring internals.
- Keep socket protocol and payload parsing backward compatible.
- Treat `simulation-real-radar.tsx` as a presentation shell, not a data/orchestration module.
- Reuse one normalized live-data pipeline for both 2D real radar and 3D preview.
- Do not persist live detections into scene entities; keep them runtime-only.

---

## Scope & Responsibilities

### Included

- Abstract real radar data retrieval/orchestration out of `src/features/scene/presentation/components/simulation/real-radar/simulation-real-radar.tsx`.
- Split `simulation-real-radar.tsx` into smaller focused units without functional regression.
- Add realistic 3D live detection rendering for at least `person` and `car` classes, with extensible class mapping.
- Subscribe to real-device socket data in 3D preview and place detections using incoming geo coordinates.
- Keep TTL, update ordering, and stale data cleanup behavior deterministic.

### Explicitly Excluded

- Backend contract changes.
- Replacing the existing simulated vision pipeline.
- Persisting live radar detections into saved scene JSON.
- Redesigning unrelated preview/editor UI.

---

## Current Baseline (Observed)

- `src/features/scene/presentation/components/simulation/real-radar/simulation-real-radar.tsx` is large (`1181` lines) and currently combines:
  - data normalization,
  - map lifecycle,
  - marker lifecycle,
  - detection expiry timers,
  - radar activity aggregation,
  - camera stream dialog state.
- `src/features/scene/presentation/components/simulation/real-radar/use-real-radar-ingestion.ts` handles websocket transport/subscription and raw message extraction, but 2D map-specific state and transformation logic are still inside the component.
- 3D preview rendering (`simulation-scene.tsx`) currently uses scene entities + simulated people and does not render real-device live detections from socket payloads.

---

## Target Architecture

### 1) Shared Live Radar Contract (Runtime)

- Introduce normalized runtime detection model (example fields):
  - `trackerId`, `cameraId`, `className`, `confidence`,
  - `lat`, `lon`,
  - `timestampValue`,
  - `lastSeenAt`,
  - optional heading/speed metadata when available.
- Keep this model independent from mapbox/three rendering details.

### 2) Data Retrieval Abstraction Boundary

- Keep websocket transport in ingestion hook.
- Move message-to-runtime-state orchestration into a dedicated shared hook/store layer.
- Expose a read API usable by:
  - `SimulationRealRadar` (2D map overlay),
  - `SimulationScene` (3D live meshes).

### 3) `SimulationRealRadar` Decomposition

- Reduce `simulation-real-radar.tsx` to composition/orchestration only.
- Extract responsibilities into dedicated modules:
  - geo/math helpers,
  - camera marker management,
  - detection marker management,
  - FOV source/layer update logic,
  - radar update expiry handling.
- Preserve behavior:
  - camera marker click opens stream dialog,
  - live tracker count updates,
  - FOV polygons refresh with camera updates,
  - existing hidden activities behavior remains.

### 4) Realistic 3D Detection Mesh Layer

- Add dedicated 3D live detection renderer component for runtime detections.
- Support class-to-model mapping:
  - `person` -> humanoid model,
  - `car` -> vehicle model,
  - fallback class -> generic proxy model.
- Use physically plausible scale, ground contact, and orientation.
- Add LOD/fallback policy to protect FPS under higher tracker counts.

### 5) Exact Placement from Socket Geo Data

- Convert live detection `lat/lon` to world coordinates using the same simulation transformer origin.
- Place runtime entities at transformed world positions in active scene area.
- Apply jitter smoothing and TTL fade/removal to avoid visual popping.

---

## Implementation Workstreams

### Workstream A: Runtime Data Model + Shared State

- [ ] Define normalized live detection runtime types (extend `real-radar-types` or dedicated runtime file).
- [ ] Add shared state boundary for live detections (store slice or dedicated local store module).
- [ ] Keep selectors focused: by area, by camera, by class, by recency.

### Workstream B: Ingestion/Orchestration Refactor

- [ ] Keep websocket subscribe/unsubscribe protocol in ingestion transport.
- [ ] Extract message orchestration and TTL handling from `simulation-real-radar.tsx` into reusable hook/service.
- [ ] Ensure ordering policy for tracker updates remains deterministic (newest timestamp wins).

### Workstream C: `SimulationRealRadar` Size Reduction

- [ ] Extract map-specific marker/FOV/detection helpers out of component body.
- [ ] Keep component near target size limits from project React rules.
- [ ] Preserve all existing 2D real radar interactions and stream modal behavior.

### Workstream D: 3D Live Detection Rendering

- [ ] Add `RealRadarDetectionsMesh` (or equivalent) under simulation components.
- [ ] Add model registry and class mapping for realistic meshes.
- [ ] Add fallback mesh path for unknown classes.
- [ ] Add visual state handling (new, tracked, stale/fading).

### Workstream E: 3D Subscription Wiring

- [ ] Feed active real-device IDs from focused area cameras into shared ingestion flow.
- [ ] Wire live detection state into 3D preview path.
- [ ] Render detections only when data has valid geo coordinates and active TTL.
- [ ] Keep 2D and 3D consumers in sync from the same runtime source.

### Workstream F: Hardening + Verification

- [ ] Typecheck and lint pass on all touched files.
- [ ] Run manual regression checks for 2D real radar behavior.
- [ ] Run manual validation for 3D live placement accuracy and model rendering.

---

## Suggested File Targets

- `src/features/scene/presentation/components/simulation/real-radar/simulation-real-radar.tsx`
- `src/features/scene/presentation/components/simulation/real-radar/use-real-radar-ingestion.ts`
- `src/features/scene/presentation/components/simulation/real-radar/real-radar-types.ts`
- `src/features/scene/presentation/components/simulation/simulation-scene.tsx`
- `src/features/scene/presentation/components/simulation/entity-meshes.tsx` or new dedicated live-detection mesh file(s)
- `src/features/scene/infrastructure/stores/ui.store.ts` (only if shared state is hosted there)

---

## Acceptance Checklist

- [ ] Data retrieval/orchestration is abstracted away from `simulation-real-radar.tsx`.
- [ ] `simulation-real-radar.tsx` is substantially smaller and focused on composition/presentation.
- [ ] No loss of current real radar functionality (markers, FOV, detection updates, camera dialog, activities feed data).
- [ ] 3D preview renders realistic live detection objects for at least `person` and `car`.
- [ ] Live detections in 3D are driven by real-device socket updates.
- [ ] 3D positions match incoming geo coordinates (transformed consistently with scene origin/transformer).
- [ ] Stale trackers are removed/faded based on TTL without leaking timers/resources.

---

## Validation Matrix

1. Refactor Regression
- [ ] Existing 2D real radar flow unchanged with active socket stream.
- [ ] Selecting camera marker still opens correct real camera feed.

2. Data Integrity
- [ ] Duplicate/out-of-order messages do not regress tracker state.
- [ ] Missing/invalid fields are ignored safely without runtime errors.

3. 3D Rendering
- [ ] Person/car detections appear with realistic scale in 3D mode.
- [ ] Unknown classes render via fallback without crashing.

4. Placement Accuracy
- [ ] Known test coordinates appear at expected map/world positions.
- [ ] Active area scoping prevents cross-area ghost detections.

5. Performance
- [ ] No significant FPS collapse when multiple trackers are active.
- [ ] Resource cleanup works on mode changes/unmounts.

---

## Risks & Mitigations

1. Risk: Coordinate mismatch between map and 3D placement.
Mitigation: one shared geo-to-world conversion boundary and validation fixtures for sample points.

2. Risk: Model assets are heavy and reduce FPS.
Mitigation: class-based LOD, lightweight fallback meshes, and lazy loading.

3. Risk: Refactor breaks existing 2D radar behavior.
Mitigation: preserve contracts, migrate in slices, and run explicit regression checklist.

4. Risk: Socket burst traffic creates UI churn.
Mitigation: central dedupe/update policy, TTL expiration, and controlled render invalidation.

---

## Execution Sequence (PR Slices)

### PR-1: Data Abstraction Foundations

Scope:
- normalized runtime types
- shared live detection state boundary
- ingestion-to-runtime orchestration extraction

Gate:
- 2D radar still functional through new abstraction layer

### PR-2: `SimulationRealRadar` Decomposition

Scope:
- extract map/FOV/marker/update helpers out of component
- shrink and simplify component composition

Gate:
- no behavior regressions in existing real radar UX

### PR-3: 3D Live Detection Meshes

Scope:
- add realistic model rendering layer and class mapping
- fallback meshes + basic visual lifecycle

Gate:
- person/car live detections visible in 3D mode

### PR-4: Socket-to-3D Exact Placement + Hardening

Scope:
- wire live stream to 3D view
- validate placement, TTL cleanup, and performance

Gate:
- acceptance checklist passes end-to-end

---

## Definition of Done

Real radar data flow is abstracted and reusable, `simulation-real-radar.tsx` is reduced to a maintainable presentation component, and 3D preview displays realistic live real-device detections (starting with people and cars) at accurate socket-provided positions without regressing existing radar behavior.
