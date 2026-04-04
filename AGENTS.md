## Project Overview
- Embeddable React library exporting `VisionSimulator` for scene editing + simulation
- Map-based editor (Mapbox) for areas/walls/shapes/cameras/people
- Preview/simulation (2D/3D + radar + camera feeds) with same scene state
- Data via Orval API clients + TanStack Query; host provides tokens/IDs

## Mental Model (System Flow)
- Host renders `VisionSimulator` → `src/app.tsx` sets axios base/auth + query client
- Vision fetch (`useGetVisionByIDSuspense`) → scene stored in Zustand → editor/sim render
- Editor actions → `scene.store` mutate → history snapshot + UI re-render; `scene.meta.updatedAt` bumps
- View mode policy (`VisionSimulatorMode`) gates editor/preview behavior
- Save/leave: snapshot + `updateVision` + `uploadFile` → dirty state cleared

## Architecture
- Editor UI: `features/scene/components` + properties/dialogs
- Map layer: `features/scene/map` (Mapbox GL, drawing/selection, FOV worker)
- Simulation: `features/scene/simulation` (Three.js + radar + feeds)
- State: `features/scene/state` (scene/ui/history stores)
- Domain + utils: `features/scene/services` + `utils`
- Data provider: `data-provider` (axios + query + Orval clients)

## Key Files & Responsibilities
- `src/index.ts` → public exports
- `src/app.tsx` → library runtime bootstrap
- `src/main.tsx` → dev app entry
- `src/features/scene/components/editor-layout.tsx` → editor orchestration
- `src/features/scene/state/scene.store.ts` → scene mutations + selection
- `src/features/scene/state/ui.store.ts` → tool/view/radar state
- `src/features/scene/state/history.store.ts` → undo/redo stack
- `src/features/scene/hooks/use-history-recorder.ts` → history recording helpers
- `src/features/scene/map/map-view.tsx` → Mapbox view/overlays
- `src/features/scene/simulation/simulation-viewport.tsx` → sim entry
- `src/features/scene/utils/scene-serializer.ts` → JSON I/O
- `src/features/scene/utils/scene-export.ts` → snapshot/export
- `src/data-provider/axios/axios.ts` → axios config
- `src/data-provider/react-query.ts` → QueryClient config
- `src/data-provider/api/services/v2/*` → generated API clients
- `src/features/scene/map/camera-fov.worker.ts` → FOV worker logic
- `tsup.config.ts` → build + worker assets

## Core Abstractions & Data Models
- `SceneRoot` = scene graph + meta + origin + settings
- Entities: `AreaEntity`, `WallEntity`, `ShapeEntity`, `CameraEntity`, `PersonEntity`
- UI state: view/tool/panels + radar/live feed state
- History: snapshot stack with `applying` guard
- Mode: `VisionSimulatorMode` (`editor` | `preview`) → policy flags

## Important Functions / APIs
- `applyAxiosApiBaseUrl`, `applyAxiosAuthorizationHeader` → configure API calls
- `useGetVisionByIDSuspense` → initial scene fetch
- `updateVision`, `uploadFile` → save scene + snapshot
- `useSceneStore` actions → all scene edits
- `useHistoryRecorder` → undo/redo recording
- `serializeScene`, `parseScene` → JSON serialization
- `captureSceneSnapshot` → image capture

## Development Conventions
- Path alias: `@/` → `src`
- Tailwind class prefix: `vs:`
- State updates via store actions + `immer`
- Avoid editing Orval-generated files

## AI Agent Rules (DO / DON'T)
DO:
- Use store actions (`useSceneStore`/`useUiStore`/`useHistoryStore`) for state edits
- Record history for meaningful scene changes
- Keep mode policy behavior consistent with `VisionSimulatorMode`
- Update worker wiring if worker files move

DON'T:
- Mutate store state directly in components or utils
- Skip history recording for scene edits that users expect to undo
- Remove disabled localStorage persistence blocks in `scene.store.ts`
- Bypass axios base/auth setup in `src/app.tsx`

## Editing Strategy
- Prefer smallest change: store action or util first, then UI
- Reuse factories/constants for entity defaults/styles
- For editor behavior: map hooks → store actions → history
- For simulation: change sim module + any derived UI state

## Common Tasks
- Add feature → extend types → add store action → wire UI → history
- Fix bug → trace from UI to store action to derived state
- Extend system → new service/util → integrate in map/sim entry

## Constraints & Gotchas
- LocalStorage persistence intentionally disabled
- History ignores updates while `history.store` is `applying`
- `preview` mode locks view mode + hides editor controls
- FOV worker requires alignment with hook + build config

## Dependencies & Tools
- React 19 + Vite; Radix UI + shadcn UI
- Zustand + immer for state
- TanStack Query + axios + Orval for data
- mapbox-gl + react-map-gl + mapbox-gl-draw for map
- three + @react-three/fiber for simulation
- konva + react-konva for 2D canvas

## Entry Points
- Library export: `src/index.ts`
- Runtime bootstrap: `src/app.tsx`
- Dev app: `src/main.tsx`
- Editor root: `features/scene/components/editor-layout.tsx`
- Map root: `features/scene/map/map-view.tsx`
- Sim root: `features/scene/simulation/simulation-viewport.tsx`

## Quick Reference (Ultra-Compressed)
- Need initial data → `useGetVisionByIDSuspense` in `src/app.tsx`
- Edit scene → `scene.store.ts` actions
- Undo/redo → `history.store.ts` + `use-history-recorder.ts`
- Editor UI → `features/scene/components/*`
- Map behavior → `features/scene/map/*`
- Simulation behavior → `features/scene/simulation/*`
- Mode logic → `vision-simulator-mode.ts`
- API setup → `data-provider/axios/axios.ts`
- Worker FOV → `camera-fov.worker.ts`
