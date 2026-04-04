# System Overview

## Runtime Flow
1. Host app renders `VisionSimulator` and provides API tokens, map token, and simulator ID.
2. `src/app.tsx` configures axios, TanStack Query, and Zustand stores.
3. Editor UI renders Mapbox-based tools for scene creation and editing.
4. Simulation UI renders Three.js scene, radar, and camera feeds for preview.
5. Export and recording utilities generate images, video, or JSON from the current scene.

## Core Modules
- Editor UI: `src/features/scene/components`
- Map editor: `src/features/scene/map`
- Simulation engine: `src/features/scene/simulation`
- State stores: `src/features/scene/state`
- Core logic: `src/features/scene/services`
- Persistence: `src/features/scene/adapters`

## State
Zustand stores manage the live scene (`scene.store.ts`), UI state (`ui.store.ts`), and history (`history.store.ts`). The editor and simulation views subscribe to these stores to stay in sync.
