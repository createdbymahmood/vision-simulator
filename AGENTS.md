## Project Overview
- React + TypeScript library exporting `VisionSimulator` (editor + simulation) for configuring camera coverage scenes.
- Editor: Mapbox 2D tools; Simulation: Three.js + React Three Fiber for 3D preview, radar, and camera feeds.
- Data loaded via Axios + TanStack Query from API (vision by ID); state via Zustand (scene/UI/history).
- Built as a library (`tsup`) and a dev/demo app (`vite`), with host CSS exported.

## Mental Model (System Flow)
- Host renders `VisionSimulator` → `src/app.tsx` configures Axios + QueryClient and resolves mode.
- `useGetVisionByIDSuspense` fetches vision → `createInitialSceneState` seeds `SceneStore` + `HistoryStore` + `UiStore`.
- `EditorLayout` binds stores to Mapbox editor and Three.js simulation; UI actions call store methods → `scene.meta.updatedAt` and history update.
- Map overlays use camera FOV web worker; simulation renders from same scene state (2D/3D preview).
- Export/recording uses scene serializers + snapshot capture; changes to types or store ripple through map layers + simulation meshes + history.

## Architecture
- App shell: `src/app.tsx` (providers, data fetch, mode policy) + `src/index.ts` (library export).
- Core domain: `src/features/scene/*` (components, map, simulation, state, services, utils, types).
- Data layer: `src/data-provider/*` (Axios setup, React Query, Orval-generated API clients).
- UI kit: `src/components/ui/*` (Radix/shadcn) + `src/components/shared/*` (Zustand context helpers).
- Shared utilities: `src/shared/geo/*`, `src/lib/*`.
- Secondary roots: `example/` (demo app), `docs/` (architecture/workflows), `scripts/` (build/release utilities), `dist/` (build output).

## Key Files & Responsibilities
- src/app.tsx → app shell; configures Axios + Query; wires stores/providers and layout.
- src/index.ts → public library exports (`VisionSimulator` + types).
- src/main.tsx → local dev app entry (env-driven props).
- example/src/main.tsx → example app entry; verifies leave-guard behavior.
- src/features/scene/components/editor-layout.tsx → main UI orchestration; map + simulation + history + export.
- src/features/scene/map/map-view.tsx → Mapbox editor surface and layers.
- src/features/scene/simulation/simulation-scene.tsx → Three.js scene root.
- src/features/scene/state/scene.store.ts → scene data + mutations + selection.
- src/features/scene/state/ui.store.ts → tool/view/radar/live state + UI toggles.
- src/features/scene/state/history.store.ts → undo/redo stacks + seed/apply.
- src/features/scene/state/history-actions.ts → action → history description mapping.
- src/features/scene/services/scene-factory.ts → default scene creation + timestamps.
- src/features/scene/services/camera-factory.ts → camera entity defaults (optics, PTZ).
- src/features/scene/utils/scene-serializer.ts → scene JSON parse/serialize.
- src/features/scene/utils/scene-export.ts → filenames + download helpers.
- src/features/scene/utils/scene-snapshot-capture.ts → Mapbox snapshot capture.
- src/features/scene/map/camera-fov.worker.ts → FOV/occlusion computation.
- src/features/scene/map/camera-fov.worker.js → worker bootstrap for bundling.
- src/features/scene/map/use-camera-fov-worker.ts → worker hook wiring.
- src/data-provider/axios/axios.ts → Axios instances + auth/base config.
- src/data-provider/react-query.ts → QueryClient defaults + error toasts.
- src/data-provider/api/services/v2/vision-simulator.ts → Orval client (vision fetch).
- tsup.config.ts → library build entries (includes worker).
- vite.config.ts → dev build config + Tailwind + TS path aliases.
- src/styles.css → global app styles + Tailwind entry.
- src/host.css → host integration styles (copied to dist).

## Core Abstractions & Data Models
- `SceneRoot` → top-level scene (areas, walls, shapes, cameras, people, meta, origin, seed).
- `SceneEntity` → `AreaEntity | WallEntity | ShapeEntity | CameraEntity | PersonEntity`.
- `EditorMode` (`map` | `canvas`), `ViewMode` (`editor` | `preview`), `PreviewViewMode` (`2d` | `3d`).
- `VisionSimulatorMode` (`editor` | `preview`) + mode policy.
- `CameraOptics`, `PtzState`, `CameraPlacementProfile` → camera behavior/placement.
- `UiState` → active tool, view modes, panel state, radar/live detection data.
- `HistoryEntry` → scene snapshot + description + timestamp.

## Important Functions / APIs
- `configureDataProvider` (via `applyAxiosApiBaseUrl`, `applyAxiosAuthorizationHeader`) → global API config.
- `useGetVisionByIDSuspense` → loads vision data for initial scene.
- `SceneStore` actions (`setScene`, `updateScene`, `add*`, `deleteEntities`) → single source of scene mutations.
- `useHistoryRecorder` + `HistoryStore.record/undo/redo` → undo/redo tracking.
- `createInitialScene` / `createCameraEntity` / `createAreaEntity` → default entity construction.
- `serializeScene` / `parseScene` → import/export JSON.
- `captureSceneSnapshot` → map-based image export.
- `useCameraFovWorker` → map overlay FOV computation.

## Development Conventions
- Feature-based structure under `src/features/scene/*` with `components/`, `map/`, `simulation/`, `state/`, `services/`, `utils/`, `types/`.
- Path aliases: `@/*` for `src/*`, `@lodash-es` for lodash tree-shaken imports.
- Zustand stores use Immer; mutate via store actions (not direct object edits).
- Orval-generated clients in `src/data-provider/api/*` are regenerated via `pnpm orval`.
- Styles: Tailwind via `src/styles.css`; host app must import both `styles.css` and `host.css`.

## AI Agent Rules (DO / DON'T)
DO:
- Use store actions + `useHistoryRecorder` when mutating scene data to keep history consistent.
- Update types + factories + store + UI layers together when adding/modifying entity fields.
- Keep worker changes aligned across `camera-fov.worker.ts`, `camera-fov.worker.js`, and `tsup.config.ts`.
- Treat Orval clients as generated; regenerate instead of manual edits.
DON'T:
- Bypass `configureDataProvider`; queries rely on global Axios defaults.
- Mutate scene state directly or outside Zustand stores (breaks history/dirty tracking).
- Move/rename worker entry without updating `tsup.config.ts` and worker hooks.
- Expect localStorage persistence; it is intentionally disabled in `scene.store.ts`.

## Editing Strategy
- Start from the closest feature module in `src/features/scene/*`; make minimal local changes.
- When changing scene data: update `types` → `services` (defaults) → `state` (store actions) → map/simulation rendering.
- Reuse existing utilities/components; add new helpers under `services/` or `utils/` before introducing new dependencies.

## Common Tasks
- Add feature: extend `types` + `scene.store.ts` actions, then wire UI in `components/` and rendering in `map/` or `simulation/`.
- Fix bug: reproduce in dev or `example/`, trace state via `scene.store.ts`/`ui.store.ts`, then adjust the responsible module.
- Extend system: update entity model, add factory defaults, update map layers + simulation meshes, and adjust history descriptors.

## Constraints & Gotchas
- `VisionSimulator` requires host props; it does not fall back to `import.meta.env` internally.
- Preview mode locks view mode and hides some UI; changes to mode policy affect layout + behavior.
- History only records via `useHistoryRecorder`; undo/redo uses cloned snapshots.
- Camera FOV worker must remain in sync with build entries; missing worker breaks overlays.
- Build output CSS is post-processed; host apps must import both CSS files for correct styling.

## Dependencies & Tools
- React 19 + Vite for dev; tsup for library builds.
- Mapbox GL + react-map-gl for editor; Three.js + @react-three/fiber/drei for simulation.
- Zustand + Immer for state; TanStack Query for data; Axios for API calls.
- Tailwind CSS (Vite + CLI) and Radix/shadcn UI components.
- Orval for API client generation.

## Entry Points
- src/index.ts → library export entry (`VisionSimulator`).
- src/app.tsx → app shell used by library export.
- src/main.tsx → local dev app entry.
- example/src/main.tsx → demo app entry.
- tsup.config.ts → library build entry (includes worker).

## Quick Reference (Ultra-Compressed)
- Need scene data → `useSceneStore` (`src/features/scene/state/scene.store.ts`).
- Need UI/tool state → `useUiStore` (`src/features/scene/state/ui.store.ts`).
- Need undo/redo → `useHistoryRecorder` + `history.store.ts`.
- Modify mode behavior → `services/vision-simulator-mode.ts`.
- Add entity defaults → `services/*-factory.ts` + `constants/*`.
- Map overlay work → `features/scene/map/*` (worker in `camera-fov.worker.ts`).
- Simulation changes → `features/scene/simulation/*` (`simulation-scene.tsx` root).
- API change → `src/data-provider/orval.config.ts` + regenerate clients.
- Export/snapshot → `utils/scene-export.ts` + `scene-snapshot-capture.ts`.
- Style fixes → `src/styles.css` + `src/host.css`.
