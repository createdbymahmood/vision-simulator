# Rendering Stack

## Editor (2D)
- Mapbox GL is used for the editor canvas.
- Map-specific layers and drawing tools are in `src/features/scene/map`.
- The editor supports Map Mode and Canvas Mode; Canvas Mode hides tiles and shows a grid.

## Simulation (3D)
- Three.js is used for the simulation view.
- React Three Fiber provides the component abstraction (`@react-three/fiber`).
- Radar, camera frustums, and collision overlays live in `src/features/scene/simulation`.

## Performance Notes
- Camera FOV overlays are computed in a web worker.
- Simulation updates are driven by `useFrame` hooks and batched where possible.
