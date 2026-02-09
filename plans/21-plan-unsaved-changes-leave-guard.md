# Phase 21: Unsaved Changes Leave Guard (Navigation + Unmount)

**Timeline Reference**: Post-Phase 20 follow-up

---

## Phase Goal

Prevent accidental data loss by intercepting all leave attempts and requiring an explicit user decision when unsaved changes exist.

Target behavior:
- Route change should be blocked and show a confirmation dialog.
- Back/forward navigation should be blocked and show a confirmation dialog.
- Browser refresh/tab-close should warn when dirty.
- Host-driven "unmount the app" flows should be blockable through an explicit contract.

---

## Why This Phase Is Critical

The simulator is embedded in host apps and can be unmounted by routing or container state changes. Without a leave guard, unsaved work is lost silently.

---

## Scope & Responsibilities

### Included

- Define a first-class unsaved-changes model (dirty/saving/clean).
- Add a leave-guard controller that decides whether navigation/unmount can proceed.
- Add UI dialog for `Save / Discard / Stay`.
- Integrate with latest TanStack Router `useBlocker` (`withResolver`, `status`, `proceed`, `reset`, `enableBeforeUnload`).
- Add host-facing API for controlled unmount flows.

### Explicitly Excluded

- Refactoring editor feature logic unrelated to save/leave flows.
- New persistence backends.
- Auto-save as a mandatory behavior (optional extension only).

---

## Important Technical Reality

React cannot reliably "cancel" an unmount after the host has already committed to unmounting. Therefore:
- Router/navigation unmount is blockable via TanStack Router `useBlocker`.
- Browser refresh/close is blockable via `beforeunload` (native browser prompt only).
- Arbitrary host `setMounted(false)` unmount must use an explicit pre-unmount handshake API provided by this package.

---

## Proposed API (Production Contract)

### 1) App Props Extensions

```ts
interface AppProps {
  // existing props...
  unsavedChanges?: {
    enabled?: boolean // default: true
    onDirtyStateChange?: (payload: {isDirty: boolean; isSaving: boolean}) => void
    confirmDialogTitle?: string
    confirmDialogDescription?: string
  }
}
```

### 2) Imperative Guard Ref for Host-Controlled Unmount

```ts
export type LeaveIntent = 'route-change' | 'history-back' | 'host-unmount' | 'browser-unload'
export type LeaveDecision = 'saved' | 'discarded' | 'cancelled'

export interface VisionSimulatorLeaveGuardHandle {
  hasUnsavedChanges: () => boolean
  requestLeave: (intent: LeaveIntent) => Promise<LeaveDecision>
}
```

```ts
interface AppProps {
  // existing props...
  leaveGuardRef?: React.Ref<VisionSimulatorLeaveGuardHandle>
}
```

### 3) Optional TanStack Router Adapter Hook (host-side usage)

```ts
export const useVisionSimulatorRouteLeaveBlocker = (options: {
  enabled: boolean
  hasUnsavedChanges: () => boolean
  onBlockedLeave: () => Promise<'proceed' | 'stay'>
}) => void
```

Implementation note:
- Internally uses TanStack Router `useBlocker({ shouldBlockFn, withResolver: true, enableBeforeUnload })`.
- If user chooses proceed, call blocker `proceed()`.
- If user chooses stay/cancel, call blocker `reset()`.

---

## Domain Model (Clean Separation)

Introduce a focused leave-guard state model independent from UI components.

```ts
type UnsavedState = {
  isDirty: boolean
  isSaving: boolean
  lastSavedRevision: number
  currentRevision: number
}
```

Dirty rule:
- `isDirty = currentRevision > lastSavedRevision`

Revision rule:
- Increment `currentRevision` for every scene mutation that changes persisted scene payload.
- Update `lastSavedRevision = currentRevision` only after successful save.

---

## Save/Leave State Machine

```text
idle(clean)
idle(dirty)
blocked(waiting-user-decision)
saving
leave-approved
leave-cancelled
save-failed
```

Decision mapping:
- `Save` -> run save pipeline -> on success approve leave; on error remain blocked.
- `Discard` -> approve leave without save.
- `Stay` -> cancel leave and keep user in editor.

---

## UI Plan (Dialog)

Add a dedicated unsaved-changes dialog component (single responsibility):
- Title: "Unsaved changes"
- Description: "You have unsaved changes. Do you want to save before leaving?"
- Actions:
  - Primary: `Save and leave`
  - Secondary: `Discard changes`
  - Ghost: `Stay`

Requirements:
- Works for keyboard and pointer.
- Shows loading state during save.
- Disables duplicate submissions while saving.
- Keeps focus management accessible.

---

## Integration Plan (Implementation Steps)

### 1) Track Dirty State Reliably

- Add revision counters to scene-related store or a dedicated unsaved-changes store.
- Increment revision from mutation points (`setScene`, `updateScene`, etc.).
- Initialize clean baseline after initial scene load is seeded.
- Mark clean after successful `handleSave` in editor flow.

### 2) Centralize Leave Guard Controller

- Add `useUnsavedChangesGuard` hook with pure decision API.
- Expose `hasUnsavedChanges` and `requestLeave(intent)`.
- Keep UI-independent decision layer testable.

### 3) Wire Dialog to Controller

- Show dialog when guard enters blocked state.
- Hook buttons to controller actions (`save`, `discard`, `stay`).

### 4) TanStack Router Blocking

- Integrate via `useBlocker` with:
  - `shouldBlockFn: () => guard.hasUnsavedChanges()`
  - `withResolver: true`
  - `enableBeforeUnload: guard.hasUnsavedChanges()`
- On `status === 'blocked'`, invoke dialog and route decision to `proceed/reset`.

### 5) Host Unmount Contract

- Expose `leaveGuardRef` handle from `App`.
- Host must call `await leaveGuardRef.current?.requestLeave('host-unmount')` before unmounting.
- Host unmount proceeds only on `saved` or `discarded`.

### 6) Back Button Behavior

- Replace direct unguarded back action path with guarded leave request.
- Preserve current UX but route through shared guard controller.

---

## Reliability & Edge Cases

- Multiple rapid navigation attempts while blocked: serialize and keep one active decision.
- Save failure while leaving: keep dialog open, show error, do not navigate.
- Non-dirty state: never show dialog.
- Preview mode: same guard behavior if unsaved edits exist.
- Browser `beforeunload`: cannot show custom modal; rely on native prompt.

---

## Testing Plan

### Unit

- Dirty calculation from revision counters.
- Guard decision outputs for `save/discard/stay`.
- Save failure path does not allow leave.

### Integration

- Route navigation blocked with unsaved changes.
- `proceed/reset` called correctly based on dialog choice.
- Browser unload registration toggles with dirty state.
- Host unmount handshake: `requestLeave('host-unmount')` returns expected decision.

### Regression

- Existing save action still works.
- Undo/redo behavior remains unchanged.
- No impact on rendering modes (`editor`/`preview`).

---

## Acceptance Checklist

- [ ] Dirty state is deterministic and independent from UI rendering details.
- [ ] Route leave is blocked with TanStack Router `useBlocker` and custom dialog.
- [ ] Browser refresh/close warns when unsaved changes exist.
- [ ] Host-driven unmount can be guarded through `leaveGuardRef.requestLeave(...)`.
- [ ] `Save / Discard / Stay` outcomes behave exactly as expected.
- [ ] No regressions in existing save/undo/redo/editor flows.

---

## Rollout Strategy

- Ship behind `unsavedChanges.enabled` defaulting to `true` for new integrations.
- Provide migration snippet for host apps using TanStack Router.
- Document host-unmount contract clearly: unmount must be preceded by `requestLeave`.
