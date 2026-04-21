# Plan: Show Retrieved Simulation Items in 2D Mode

Status: Draft
Date: 2026-04-13

## Context
Simulation items retrieved from the server currently appear only in 3D mode. We need them to render in 2D mode as well.

## Assumptions
- “Simulation items” correspond to scene entities that already render in 3D (e.g., cameras, people, areas, shapes, walls, or other overlays) but are missing from the 2D map rendering layer.
- 2D mode is the Mapbox editor surface (see `src/features/scene/map/*`) and 3D mode is the R3F simulation (see `src/features/scene/simulation/*`).
- Entities are present in `SceneStore` after server fetch; the issue is in 2D rendering or layer wiring, not in data loading.

## Steps
1. Locate the exact 3D entities that are rendering and identify their corresponding 2D layer (or missing layer) by tracing from `simulation-scene.tsx` to the matching map components in `map-view.tsx` and related map layers.
2. Verify the scene data path from server fetch → `createInitialSceneState` → `SceneStore` to confirm those entities are available in 2D mode and not filtered out by view/tool/state conditions.
3. Add or update the 2D map layer(s) to render the missing entities, reusing existing geometry utilities and styling conventions from other 2D overlays where possible.
4. Ensure layer visibility respects 2D mode and editor/preview state (e.g., `ViewMode`, `PreviewViewMode`, `EditorMode`) and is not inadvertently gated by UI toggles.
5. Add or adjust history-aware interactions only if required for 2D editing; for display-only, keep changes read-only and map overlay focused.
6. Test in both `editor` and `preview` modes with server-loaded data to confirm items show in 2D and 3D with consistent positioning.

## Deliverables
- Map rendering changes under `src/features/scene/map/*` to display server-loaded simulation entities in 2D.
- Any necessary state or selector updates to ensure 2D mode receives the same entity set as 3D.
- Basic regression check notes for 2D/3D visibility and mode gating.

## Risks
- Entities may be 3D-only by design and require 2D geometry/representation decisions.
- Visibility could be controlled by UI store flags (tool selection, view toggles) that differ between 2D and 3D.
- Some entities might rely on simulation-only transforms not directly available to 2D layers.

## Open Questions
- Which specific entities are missing in 2D (cameras, people, shapes, etc.)?
- Should 2D render them as icons, outlines, or footprints, and do we have existing 2D styles for them?
