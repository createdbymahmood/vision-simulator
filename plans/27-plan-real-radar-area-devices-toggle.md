# Phase 27: Real Radar for Area Devices (Toggle-Driven)

**Timeline Reference**: Post-Phase 25 follow-up

---

## Phase Goal

Integrate a real-device radar mode that can be toggled from the existing radar panel header, scoped to area devices (real cameras), while preserving the current simulation radar as the default mode.

---

## How Codex Should Use This Phase

- Keep the current radar behavior intact by default.
- Add a top-level mode toggle inside the radar header:
  - `Simulated` (existing behavior)
  - `Real` (area real-device radar behavior)
- In `Real` mode, scope camera rendering to `sourceDeviceKind === "real"` and area context.
- Keep `Radar Activities` implemented in code but not visible in the app UI.
- Reuse existing simulation radar geometry/interactions for this slice; do not block integration waiting for websocket plumbing.

---

## Scope & Responsibilities

### Included

- Add a radar mode toggle in header UI.
- Add mode handling in simulation radar container.
- Add real-device camera filtering for radar rendering.
- Add hidden radar activities component and data hook (ported from prior radar implementation).
- Keep footer stats functional under both modes.

### Explicitly Excluded

- Full websocket ingestion migration from prior `~~` stack.
- Mapbox-based legacy radar page replacement.
- New backend contracts.
- Exposing activities panel in visible UI.

---

## Current Baseline (Observed)

- `SimulationRadar` renders one mode (simulated-only).
- Header has static title only (`RADAR`).
- Prior radar sources contain useful parsing and activity-list concepts, but depend on missing legacy utilities/aliases (`~~/*`) and cannot be directly mounted in current app.

---

## Target Architecture

### 1) Radar Mode Contract

- Add radar mode type:
  - `simulated | real`
- Radar mode stays local to radar component for now.
- Header switch controls mode directly.

### 2) Real Radar Device Scoping

- For `real` mode:
  - include cameras where `camera.sourceDeviceKind === "real"`
  - keep area framing via existing `focusAreaId` logic
  - continue using existing geometry/interactions pipeline (`useRadarGeometry`, pan/zoom)

### 3) Hidden Activities Contract

- Keep `Radar Activities` component implemented and fed by a hook.
- Activities must be mounted only in a hidden container (`className="hidden"`, `aria-hidden="true"`).
- No visible placement in side panels yet.

---

## Implementation Workstreams

### Workstream A: Header Toggle

- [ ] Extend `simulation-radar-header.tsx` props with mode + callback.
- [ ] Add shadcn `Switch` with `onCheckedChange`.
- [ ] Keep title and header layout consistent with current radar card.

### Workstream B: Mode-Aware Radar Rendering

- [ ] Add radar mode state to `simulation-radar.tsx`.
- [ ] Build mode-aware scene source:
  - simulated: original scene
  - real: scene with real cameras only
- [ ] Keep existing SVG radar interactions and selection flow unchanged.

### Workstream C: Activities (Hidden)

- [ ] Add `simulation-real-radar-activities.tsx`.
- [ ] Add `use-real-radar-activities.ts` hook.
- [ ] Mount activities only in hidden wrapper in real mode.

### Workstream D: Validation

- [ ] Ensure touched files lint/type-check in isolation.
- [ ] Confirm no visible activities panel appears.
- [ ] Confirm radar mode switch updates camera scope.

---

## Acceptance Checklist

- [ ] Radar header includes a mode switch at top.
- [ ] Default mode remains simulated radar.
- [ ] Switching to real mode filters to real area cameras.
- [ ] Existing radar interactions (pan/zoom/select) still work.
- [ ] Radar activities component exists in code.
- [ ] Activities are not visible anywhere in app.

---

## Risks & Mitigations

1. Risk: Real radar data stream integration is blocked by missing legacy utils from prior implementation.
   Mitigation: Ship mode toggle + scoped real-camera radar now; keep activities hook modular for later websocket/data adapter wiring.

2. Risk: Behavior drift between simulated and real modes.
   Mitigation: Reuse existing geometry and interaction code path; only change source camera set.

3. Risk: Activities component accidentally rendered in UI.
   Mitigation: Mount only behind hidden wrapper and keep no visible route/panel binding.

---

## Missing Utility Boundary (For Next Slice)

To fully migrate prior live radar ingestion, we need replacements for legacy `~~` dependencies used by the older implementation:

- Socket/auth hook equivalent for live device stream subscription
- Device connector mapper utility for field-to-sensor payloads
- Data retrieval method store (or fixed ingestion mode contract)

This phase intentionally avoids blocking on these and prepares integration points.
