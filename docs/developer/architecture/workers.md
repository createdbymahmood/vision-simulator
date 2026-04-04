# Workers

## Camera FOV Worker
- Source: `src/features/scene/map/camera-fov.worker.ts`
- Purpose: computes camera FOV wedges and occlusion rings for Mapbox overlays
- Bootstrap: `src/features/scene/map/camera-fov.worker.js`

## Build Integration
Library build exposes the worker via `tsup.config.ts` so it is copied into `dist/assets`.

If you move worker files, update:
- `tsup.config.ts`
- `src/features/scene/map/use-camera-fov-worker.ts`
