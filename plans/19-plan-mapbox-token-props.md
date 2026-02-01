# Phase 19: Inject Mapbox Token via App Props

**Timeline Reference**: Post-Phase 18 follow-up

---

## Phase Goal

Allow the host application to provide `VITE_MAPBOX_TOKEN` (or an equivalent Mapbox token) via `App` component props instead of relying on `import.meta.env`. This enables consumers of the installable module to pass their own token at runtime.

---

## How Codex Should Use This Phase

- Do not implement features; this is **plan-only**.
- Require the token to be provided via props (no `import.meta.env` fallback).
- Thread the token through `App` → map-related components without global leakage.

---

## Scope & Responsibilities

### Included

- Define a new `App` prop for Mapbox token (e.g., `mapboxToken?: string`).
- Route the prop into `UiStoreProvider` via `initialState`.
- Plan how the token flows into Mapbox components (Map view, static map, etc.).
- Identify all usages of `import.meta.env.VITE_MAPBOX_TOKEN`.
- Plan safe fallback behavior when prop is missing.

### Explicitly Excluded

- Falling back to `import.meta.env` in any runtime path.
- Refactoring unrelated map features.
- Adding new UI controls for token input.

---

## Deliverables (Plan Tasks)

### 1) Token API Contract

- [ ] Add a named prop on `App` (e.g., `mapboxToken?: string`).
- [ ] Extend `UiStoreProvider` initial state to include `mapboxToken`.
- [ ] Pass the prop through `UiStoreProvider initialState={{ mapboxToken }}`.
- [ ] Document the expected format and required usage in module README.
- [ ] Confirm `VisionSimulator` export continues to use `App` with props.

### 2) Token Propagation Strategy

- [ ] Identify token usage sites:
  - Mapbox map component (`mapboxAccessToken` prop).
  - Static map fetch (Mapbox static URL).
- [ ] Use UI store as the single token source of truth:
  - Read token via `useUiStore((state) => state.mapboxToken)`.
  - No prop-drilling beyond `App` → `UiStoreProvider`.
- [ ] Enforce no fallback behavior:
  - Token must be provided via `App` props (or store initial state).

### 3) Implementation Plan (No Code Yet)

- [ ] Update `App` props interface and pass token into `UiStoreProvider` initial state.
- [ ] Add `mapboxToken` to UI store state shape (with default `undefined`).
- [ ] Update map components to read from UI store (not props).
- [ ] Replace direct `import.meta.env.VITE_MAPBOX_TOKEN` lookups with:
  - Store-provided or prop-provided token only.
- [ ] Ensure token is not required for non-map modes.

### 4) Consumer Documentation

- [ ] Document usage in `README.md` for module consumers:
  - Example: `<VisionSimulator mapboxToken="..." />`
- [ ] Note that map features require a token; other modes should still work.

---

## Acceptance Checklist

- [ ] A plan exists to inject Mapbox token via `App` props.
- [ ] The plan includes fallback to `import.meta.env` for standalone app usage.
- [ ] All token usage sites are identified and planned for updates.
- [ ] No breaking changes for existing app usage are introduced in the plan.
