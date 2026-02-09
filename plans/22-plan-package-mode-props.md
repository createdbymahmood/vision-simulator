# Phase 22: Host-Controlled Package Mode Prop (Editor/Preview)

**Timeline Reference**: Post-Phase 21 follow-up

---

## Phase Goal

Expose a package-level `mode` prop that controls the visible surface:
- `mode='editor'` (default): full editor experience.
- `mode='preview'`: 3D simulation-only surface without top bar or editor views.

Design this as an extensible mode system so additional modes can be added later with minimal refactoring.

---

## How Codex Should Use This Phase

- Do not implement features; this is **plan-only**.
- Treat host-provided `mode` as the source of truth when present.
- Preserve current behavior when `mode` is omitted (`editor` default).
- Use a central mode registry/config instead of scattered conditional logic.

---

## Scope & Responsibilities

### Included

- Public API update on `AppProps` for package mode.
- Mapping from package mode to UI visibility/interaction policy.
- Preview-mode lock behavior (no editor chrome and no editor switching).
- Documentation and usage examples for consumers.
- Planned tests for mode behavior and regression protection.

### Explicitly Excluded

- Adding net-new modes beyond `editor` and `preview` in this phase.
- Refactoring simulation internals unrelated to mode visibility.
- Visual redesign of existing controls.
- Scene/domain model or network API changes.

---

## Proposed API Contract (Plan)

```ts
export type VisionSimulatorMode = 'editor' | 'preview'

export interface AppProps {
  // existing props...
  mode?: VisionSimulatorMode
}
```

Contract rules:
- `mode` defaults to `'editor'`.
- `mode='preview'` renders simulation-only UI (no top bar/editor surfaces).
- Future modes must be added by extending `VisionSimulatorMode` and one mode config entry.

---

## Architecture Strategy

### 1) Mode Registry (Single Source of Truth)

Define a mode-definition map (naming TBD) that captures behavior flags per mode, such as:
- Initial view mode.
- Whether view mode is locked.
- Show/hide editor chrome.
- Show/hide simulation top chrome and back affordances.

This keeps mode behavior additive and avoids duplicated `mode === 'preview'` checks.

### 2) App Boundary Ownership

`App` resolves effective mode (`props.mode ?? 'editor'`) and passes it through provider/layout boundaries.
No nested component should infer package mode from unrelated state.

### 3) UI Store and View Mode Coordination

Keep a clear split between:
- Package mode (host contract).
- View mode (internal editor/preview state).

In preview package mode:
- Initialize to preview view.
- Prevent transitions back to editor.

In editor package mode:
- Preserve existing editor/preview toggle behavior.

### 4) Rendering Gating

Define explicit rendering rules:
- Editor-only: `TopPanel`, `ViewportShell`, `BottomNavigation`, `RightRail`, editor dialogs/sheets.
- Preview-only: simulation view container.
- Shared overlays: keep only overlays that remain meaningful in forced preview.

### 5) Top Bar Policy

Because the requirement states "without topbar", forced preview mode should hide top bars and display the simulation content surface only.
If product requirements later re-enable controls in preview, this should be a mode-registry flag update rather than structural refactor.

---

## Deliverables (Plan Tasks)

### 1) Public API and Types

- [ ] Add `VisionSimulatorMode` export.
- [ ] Add optional `mode?: VisionSimulatorMode` to `AppProps`.
- [ ] Preserve backward compatibility via default `'editor'`.

### 2) Mode Registry and Propagation

- [ ] Define an exhaustive mode config object for supported modes.
- [ ] Resolve effective mode at the `App` boundary and pass downstream.
- [ ] Replace ad-hoc mode checks with config-based consumption at layout boundaries.

### 3) Preview Behavior Definition

- [ ] Force preview as initial/effective view.
- [ ] Disable/hide any "Back to editor" affordance in forced preview.
- [ ] Hide editor chrome and non-simulation surfaces.
- [ ] Hide top bars in forced preview per requirement.

### 4) Editor Behavior Preservation

- [ ] Keep existing behavior unchanged when `mode` is omitted or `'editor'`.
- [ ] Ensure editor save/export/undo/redo flows are unaffected.
- [ ] Ensure unsaved-changes guard behavior remains intact in editor mode.

### 5) Documentation and Consumer Guidance

- [ ] Update README prop examples to include `mode`.
- [ ] Add usage examples for both `editor` and `preview`.
- [ ] Document intentional UI suppression in preview mode.

### 6) Validation and Tests (Planned)

- [ ] Unit test default mode resolution (`undefined -> 'editor'`).
- [ ] Component tests for mode-based visibility gating.
- [ ] Regression test that forced preview cannot switch to editor via UI callbacks.

---

## Acceptance Checklist

- [ ] Plan defines host-level `mode` prop with default `editor`.
- [ ] Plan guarantees simulation-only rendering for `preview` with no top bar/editor views.
- [ ] Plan uses an extensible mode registry for future modes.
- [ ] Plan preserves backward compatibility for existing consumers.
- [ ] Plan includes documentation and test strategy updates.
