# Scene Feature Layout

`src/features/scene` is the main product module and uses a flat, feature-based structure.

## Folder Map
- `components/`: editor UI components and panels
- `map/`: Mapbox view, drawing tools, map workers
- `simulation/`: Three.js scene, radar, camera feeds
- `state/`: Zustand stores and history actions
- `hooks/`: reusable hooks shared across UI
- `services/`: factories and core scene logic
- `adapters/`: persistence and storage
- `utils/`: serializers and export helpers
- `constants/`: default styles and color palettes
- `types/`: shared data types and UI override contracts

## Key Files
- `state/scene.store.ts`: scene data + mutations
- `state/ui.store.ts`: tool state, selection state, view mode
- `map/map-view.tsx`: Mapbox editor container
- `simulation/simulation-scene.tsx`: Three.js setup
- `services/scene-factory.ts`: default scene creation
