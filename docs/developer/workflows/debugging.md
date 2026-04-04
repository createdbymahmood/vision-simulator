# Debugging

## Vite Dev
Run `pnpm dev` and use the browser devtools console for runtime errors. Mapbox and Three.js warnings typically surface here first.

## Build Issues
- `pnpm build` validates both type correctness and bundling.
- `pnpm build:lib` validates library output and CSS pipeline.

## Worker Issues
The camera FOV worker is sensitive to import resolution. If you see worker build errors, ensure worker imports do not rely on absolute aliases unless configured for worker bundling.
