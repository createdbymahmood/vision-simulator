# Phase 25: Real Device Camera Tile Streaming

**Timeline Reference**: Post-Phase 11 / 11.1 follow-up

---

## Phase Goal

Render real placed camera devices in the 3D playground sidebar using a live MediaMTX player, while preserving the current simulated POV + detection overlay pipeline for virtual devices.

---

## How Codex Should Use This Phase

- Keep one camera tile surface, but branch rendering by camera source kind.
- Do not remove or degrade the existing virtual feed pipeline.
- Use `@vega-tek-hub/media-mtx-player` for real device playback; avoid custom streaming stack.
- Keep integration isolated to simulation feed components and shared runtime config plumbing.
- Fail gracefully when stream URL/token is unavailable.

---

## Scope & Responsibilities

### Included

- Install and integrate `@vega-tek-hub/media-mtx-player`.
- Add runtime config plumbing for MediaMTX base URL and auth token.
- Add real-device tile player UI with:
  - Play/stop
  - Connection state label
  - Fullscreen expand/minimize
- Branch feed tile behavior:
  - `sourceDeviceKind === 'real'` -> live player
  - `sourceDeviceKind === 'virtual'` -> existing simulated canvas feed + boxes
- Keep cleanup and lifecycle safe (destroy player on unmount, restore body overflow).

### Explicitly Excluded

- Reworking camera vision math, radar behavior, or detection algorithms.
- Backend API changes.
- Recording/export behavior changes.
- Replacing virtual feed pipeline with live streams.

---

## Current Baseline (Observed)

- `SimulationCameraSidebar` renders `CameraFeedTile` for all feed targets.
- `CameraFeedTile` always mounts:
  - R3F offscreen feed canvas
  - 2D detection box overlays
- `useCameraFeedRenderers` updates all feed targets uniformly.
- Cameras already carry `sourceDeviceKind` and `sourceDeviceId`.

---

## Target Architecture

### 1) Runtime Configuration Contract

- Add optional runtime config for stream playback:
  - `mediaMtxUrl?: string`
  - existing `accessToken` should be consumable from simulation UI context.
- Expose both values through the existing app/provider/store chain used by scene UI.

### 2) Real Device Stream Contract

- Stream URL format:
  - `${mediaMtxUrl}/live_cam_${camera.sourceDeviceId}/whep`
- Player protocol:
  - `auto`
- Player behavior:
  - reconnect enabled
  - manual play/stop controls
  - optional auto-play (default off unless requested)

### 3) Feed Tile Branching Rules

- For `camera.sourceDeviceKind === 'real'`:
  - Render the MediaMTX player UI.
  - Do not mount simulated feed canvas/box overlays.
- For `camera.sourceDeviceKind === 'virtual'`:
  - Keep existing simulated feed canvas.
  - Keep existing detection overlays.

### 4) UX/State Behavior

- Show clear player state: `idle`, `connecting`, `reconnecting`, `playing`, `stopped`, `error`, `destroyed`.
- Fullscreen mode should:
  - expand player to viewport
  - lock body scroll during fullscreen
  - restore on exit/unmount
- Missing config/state fallback should show actionable empty/error state.

---

## Implementation Workstreams

### Workstream A: Dependency + Config Plumbing

- [ ] Install `@vega-tek-hub/media-mtx-player`.
- [ ] Add `mediaMtxUrl` as optional `App` runtime prop.
- [ ] Feed `mediaMtxUrl` and `accessToken` into UI store initial state.
- [ ] Add optional env pass-through in app entry (`VITE_MEDIA_MTX_URL`).

### Workstream B: Real Device Tile Player Component

- [ ] Create dedicated simulation component for real camera streaming.
- [ ] Integrate `createMediaMTXPlayer` lifecycle:
  - [ ] instantiate once per mounted tile
  - [ ] state updates from `onStateChange`
  - [ ] destroy on cleanup
- [ ] Implement controls:
  - [ ] play/stop
  - [ ] fullscreen toggle
  - [ ] status label
- [ ] Implement graceful fallback UI for missing URL/token/device id.

### Workstream C: Camera Feed Tile Branching

- [ ] Update `CameraFeedTile` to render real or virtual view based on `sourceDeviceKind`.
- [ ] Ensure virtual path keeps current behavior and visuals unchanged.
- [ ] Ensure real path does not attach virtual renderer refs/canvas.

### Workstream D: Verification

- [ ] Typecheck passes.
- [ ] Camera sidebar shows virtual feeds unchanged.
- [ ] Real camera tiles render stream player with controls.
- [ ] No memory leak on sidebar open/close or camera list changes.

---

## Acceptance Checklist

- [ ] Real placed cameras (`sourceDeviceKind: "real"`) use live MediaMTX player in tile body.
- [ ] Virtual cameras (`sourceDeviceKind: "virtual"`) still render simulated POV + detection boxes.
- [ ] Player state transitions are visible and accurate.
- [ ] Play/stop and fullscreen controls work.
- [ ] Fullscreen body scroll lock is applied and restored correctly.
- [ ] Missing MediaMTX URL/token produces non-crashing fallback UI.
- [ ] Existing simulation behavior remains stable (no regressions in radar/POV/render loop).

---

## Risks & Mitigations

1. Risk: Stream dependency unavailable or auth misconfigured.
   Mitigation: explicit fallback UI and non-fatal tile rendering.

2. Risk: Resource leaks from player instances on frequent re-renders.
   Mitigation: strict create/destroy lifecycle bound to mounted container.

3. Risk: FPS/perf regression from mixed tile modes.
   Mitigation: keep virtual render loop untouched and avoid mounting virtual refs for real tiles.

4. Risk: API surface creep in top-level app props.
   Mitigation: add optional prop only, preserve backward compatibility.

---

## Execution Sequence (PR Slices)

### PR-1: Plan + Config Plumbing

Scope:
- Add this plan file.
- Add runtime config path (`mediaMtxUrl`, `accessToken`) into UI state.

Gate:
- App compiles with optional media URL and no consumer breakage.

### PR-2: Real Device Player + Tile Branching

Scope:
- Add MediaMTX player component.
- Branch camera feed tile by device kind.

Gate:
- Real tile plays stream; virtual tile still shows simulated feed.

### PR-3: Hardening + QA

Scope:
- Fallback states, cleanup validation, fullscreen behavior polish.

Gate:
- Manual QA across mixed real/virtual camera sets is stable.

---

## Definition of Done

Camera sidebar feed tiles are source-aware:
- Virtual devices keep simulated POV rendering.
- Real devices show live MediaMTX playback with controls.
- Integration is stable, typed, and does not regress existing simulation features.
