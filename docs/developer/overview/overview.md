# Overview

The Vision Simulator is a React + TypeScript library and web app for designing spatial scenes and running camera simulations. It is distributed as `@vega-tek-hub/vision-simulator-v2` and can be embedded in a host app or run locally for development.

## Repository Facts
- Package name: `@vega-tek-hub/vision-simulator-v2`
- Package manager: `pnpm@10.30.2`
- Build tools: Vite (app), tsup (library), Tailwind CSS
- Rendering stack: Mapbox (2D editor), Three.js (3D simulation)
- State management: Zustand
- Data layer: axios + TanStack Query + generated clients

## Top-Level Structure
- `src/` application and library code
- `example/` local consumer app
- `docs/` documentation
- `scripts/` release and tooling scripts
- `dist/` build outputs (gitignored)

## Runtime Contract
The exported `VisionSimulator` component requires runtime props for API access and map rendering. See `integration/host-app.md` for usage and styling requirements.
