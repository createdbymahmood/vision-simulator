# Troubleshooting

## "This project is configured to use pnpm"
Use `pnpm` instead of `yarn` or `npm`. The repo enforces pnpm via the `packageManager` field.

## Worker Resolution Errors
If Vite cannot resolve the camera FOV worker or its dependencies:
- Verify `tsup.config.ts` has the correct worker entry
- Verify `src/features/scene/map/use-camera-fov-worker.ts` points to the correct worker URL
- Avoid absolute path aliases inside worker imports unless the bundler supports them

## Mapbox Token Missing
If Map Mode is blank, check that the host app provides a valid `mapboxToken` prop and that Mapbox tiles are reachable in the environment.
