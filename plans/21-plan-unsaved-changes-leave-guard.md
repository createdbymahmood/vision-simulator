# Phase 21: Unsaved Changes Leave Guard (As Implemented)

**Timeline Reference**: Post-Phase 20 follow-up

---

## Phase Goal

Prevent accidental data loss by blocking route/navigation leave attempts and warning on browser unload when unsaved scene changes exist.

Implemented target behavior:
- Route navigation is blocked and a confirmation dialog is shown when dirty.
- Back/forward navigation is blocked via router blocker when dirty.
- Browser refresh/tab-close shows native unload warning when dirty.
- Save/Discard/Stay decisions are handled in-app for blocked router navigation.

---

## Current Scope

### Included

- Unsaved state tracking based on scene signature and save baseline.
- Leave guard hook integrated with TanStack Router `useBlocker`.
- Native `beforeunload` warning support.
- Unsaved changes dialog UI with `Save and leave` / `Discard changes` / `Stay`.
- Host callback for dirty/saving state updates.

### Not Included (Current Implementation)

- Host-driven unmount handshake API (`requestLeave`, `leaveGuardRef`).
- Public leave-guard adapter hook for host apps.
- Custom leave intent/decision types.

---

## Public API (Current Contract)

```ts
export interface DirtyStateChangePayload {
  isDirty: boolean
  isSaving: boolean
}

export interface UnsavedChangesOptions {
  enabled?: boolean
  onDirtyStateChange?: (payload: DirtyStateChangePayload) => void
  confirmDialogTitle?: string
  confirmDialogDescription?: string
}

interface AppProps {
  // existing props...
  unsavedChanges?: UnsavedChangesOptions
}
```

Notes:
- `unsavedChanges.enabled` defaults to `true`.
- No imperative leave guard ref is exposed.

---

## Implementation Architecture

### 1) Dirty State Tracking

Implemented in `src/features/scene/presentation/hooks/use-scene-dirty-state.ts`.

Mechanics:
- Scene signature is `JSON.stringify(scene)`.
- Hook maintains:
  - `currentRevision`
  - `lastSavedRevision`
  - `currentSceneSignature`
  - `lastSavedSceneSignature`
- On scene signature change:
  - increment `currentRevision`
  - update `currentSceneSignature`
- Save flow integration:
  - `createSaveSnapshot(scene)` captures `{ sceneSignature, revision }`
  - `markSaved(snapshot)` updates saved baseline

Dirty rule currently used:
- `isDirty = enabled && currentSceneSignature !== lastSavedSceneSignature`

### 2) Leave Guard Orchestration

Implemented in `src/features/scene/presentation/hooks/use-editor-unsaved-changes-guard.ts`.

Responsibilities:
- Creates optional router blocker with:
  - `shouldBlockFn: () => enabled && isDirty`
  - `withResolver: true`
  - `enableBeforeUnload: enabled && isDirty`
- Uses `try/catch` around `useBlocker` through `useOptionalRouteBlocker(...)` to avoid crashing when router context is absent.
- Runs save pipeline via `updateVision(...)`, then `markSaved(...)`.
- Exposes dialog state/actions to presentation layer:
  - `onConfirmSaveAndLeave` -> save then `routeBlocker.proceed()`
  - `onConfirmDiscardAndLeave` -> `routeBlocker.proceed()`
  - `onConfirmStay` -> `routeBlocker.reset()`
- Emits `unsavedChanges.onDirtyStateChange({ isDirty, isSaving })`.

### 3) Browser Unload Fallback

In the same hook:
- If router blocker is not available, a native `beforeunload` listener is attached when `enabled && isDirty`.
- This keeps refresh/tab-close protection available even outside router context.

### 4) Dialog UI

Implemented in `src/features/scene/presentation/components/unsaved-changes-leave-dialog.tsx`.

Behavior:
- Uses `AlertDialog`.
- Actions:
  - `Stay` (ghost)
  - `Discard changes` (outline)
  - `Save and leave` (primary, loading state)
- Closing the dialog via outside interaction maps to `onStay()` unless currently saving.

### 5) Editor Integration

Implemented in `src/features/scene/presentation/components/editor-layout.tsx`.

Integration points:
- Calls `useEditorUnsavedChangesGuard(...)` with current `scene`, `visionSimulatorId`, and `unsavedChanges` config.
- Top panel save action uses guard `saveScene()`.
- Back action uses `window.history.back()`; router blocker handles dirty-state interception.
- Renders `UnsavedChangesLeaveDialog` from guard-derived state.

### 6) App Wiring

- `src/app.tsx` passes `unsavedChanges` into `EditorLayout`.
- `src/index.ts` exports only:
  - `DirtyStateChangePayload`
  - `UnsavedChangesOptions`

---

## Router Context Requirement

`useBlocker` requires TanStack Router context.

Current local app bootstrapping (`src/main.tsx`) provides this by:
- Wrapping UI with `RouterProvider`.
- Defining a default `/` route that renders `App`.

This ensures in-repo development mode has router-backed leave blocking.

---

## Example App Coverage

Current example (`example/src/App.tsx`) demonstrates:
- Route leave blocking (`/simulator` -> `/`).
- Browser refresh/tab-close warning when dirty.
- Dirty/saving state visualization via `onDirtyStateChange`.

No host-unmount handshake example exists, by design of current implementation.

---

## Reliability Characteristics

- Save operation is de-duplicated with `isSavingRef`.
- On save failure during leave:
  - user remains blocked
  - dialog stays open
  - error toast is shown
- On non-dirty state:
  - no blocker dialog
  - no unload warning

---

## Acceptance Checklist (As Implemented)

- [x] Dirty state is tracked from scene signature baseline.
- [x] Route leave is blocked with TanStack Router `useBlocker` and custom dialog.
- [x] Browser refresh/close warns when unsaved changes exist.
- [x] `Save / Discard / Stay` actions are wired to `proceed/reset` behavior.
- [x] Host receives dirty/saving updates through `onDirtyStateChange`.
- [ ] Host-driven arbitrary unmount guarding via imperative pre-unmount API.

---

## Migration Notes From Previous Plan Draft

Removed from contract:
- `VisionSimulatorLeaveGuardHandle`
- `requestLeave(...)`
- `LeaveIntent` / `LeaveDecision`
- Host-controlled unmount handshake requirements

Adopted contract:
- Declarative `unsavedChanges` options only
- Router-context-based blocking plus browser unload protection
