# Simulation Performance Handoff

Generated from the currently staged changes in this branch on 2026-04-22.

`.codebase-memory/adr.md` is not present in this repo, so the changes below were made against the current codebase state rather than ADR-specific constraints.

## Scope

This handoff covers all staged changes made for:

- 3D preview navigation smoothness
- hidden-canvas / hidden-render work reduction
- simulation FOV stability and caching during orbit/zoom
- pausing expensive simulation work during interaction
- camera feed rendering quality and throughput tuning
- map FOV worker regression cleanup

## Files Changed

- `src/features/scene/map/map-view-helpers.ts`
- `src/features/scene/map/use-camera-fov-worker.ts`
- `src/features/scene/map/use-camera-placement.ts`
- `src/features/scene/map/use-camera-preview-fov-worker.ts`
- `src/features/scene/simulation/camera-feed-helpers.ts`
- `src/features/scene/simulation/camera-feed-renderer-utils.ts`
- `src/features/scene/simulation/camera-fov-footprints.tsx`
- `src/features/scene/simulation/simulation-analysis-view.tsx`
- `src/features/scene/simulation/simulation-canvas.tsx`
- `src/features/scene/simulation/simulation-scene.tsx`
- `src/features/scene/simulation/use-camera-feed-renderers.ts`
- `src/features/scene/simulation/use-simulated-people.ts`

## Detailed Changes

### `src/features/scene/map/map-view-helpers.ts`

- `L410-L478`: `buildOcclusionRayAngles` now accepts `maxRayCount?: number`.
- `L416`: added `maxRayCount = MAX_OCCLUSION_RAYS` default.
- `L467-L477`: replaced hardcoded `MAX_OCCLUSION_RAYS` downsampling with `resolvedMaxRayCount`, clamped to at least `3`.
- `L636-L674`: `buildOccludedFovRing` now accepts two optional limits:
  `maxSegments?: number`
  `maxRayCount?: number`
- `L645-L646`: added defaults `maxSegments = MAX_DYNAMIC_FOV_SEGMENTS` and `maxRayCount = MAX_OCCLUSION_RAYS`.
- `L660-L663`: `resolvedSegments` now clamps against `maxSegments` instead of always clamping against `MAX_DYNAMIC_FOV_SEGMENTS`.
- `L666-L674`: `buildOcclusionRayAngles` now receives `maxRayCount`.

Why:
- This made the occlusion-ring builder configurable for simulation-specific quality caps instead of forcing one global ray budget.
- The helper remains backward-compatible because the defaults preserve the old behavior.

### `src/features/scene/map/use-camera-fov-worker.ts`

- `L11-L14`: switched imports from worker message types to `buildCameraLayerData` + `createCameraLayerDataCache`.
- `L33-L66`: replaced the full map FOV worker path with main-thread cached computation:
  `layerDataCacheRef = React.useRef(createCameraLayerDataCache())`
  `useDeferredValue` for `cameras`, `areas`, `walls`, `shapes`
  `useMemo` + `buildCameraLayerData(...)`
- `L45-L53`: returns `EMPTY_CAMERA_FOV_LAYER_DATA` when all deferred inputs are empty.
- `L55-L65`: returns only `fovs` and `directions` from the cached `buildCameraLayerData` result.

Why:
- The previous worker path still did the same heavy Turf work and paid structured-clone overhead both ways.
- The current path avoids that worker roundtrip and reuses the layer-data cache directly on the main thread.

### `src/features/scene/map/use-camera-preview-fov-worker.ts`

- `L31-L37`: added `enabled?: boolean` to `UseCameraPreviewFovWorkerParams`.
- `L44-L50`: defaulted `enabled = true`.
- `L64-L68`: worker creation is skipped when `enabled` is false.
- `L90-L96`: cleanup now also sets `workerReady` back to `false`.
- `L98-L123`: the static-data sync effect now bails out when `enabled` is false.
- `L125-L160`: `requestPreviewFov` now bails out when `enabled` is false and includes `enabled` in its dependency list.

Why:
- The preview worker now exists only when camera placement preview is actually active.
- This avoids keeping a second FOV worker around during normal preview/editor usage.

### `src/features/scene/map/use-camera-placement.ts`

- `L235-L240`: `useCameraPreviewFovWorker` now receives:
  `enabled: isEditMode && activeTool === 'place-camera'`

Why:
- This activates the preview worker only during active camera placement.

### `src/features/scene/simulation/camera-feed-helpers.ts`

- `L4`: raised `MAX_DEVICE_PIXEL_RATIO` to `1.5`.
- `L16-L24`: raised feed quality scale tiers:
  `<= 2 feeds: 1.0`
  `<= 4 feeds: 0.8`
  `> 4 feeds: 0.6`
- `L26-L34`: current feed FPS tiers are:
  `<= 2 feeds: 24`
  `<= MAX_CAMERA_FEEDS: 18`
  `> MAX_CAMERA_FEEDS: 15`

Why:
- These are the current feed-quality values after the final “increase quality of camera feed view” pass.
- They produce sharper and less choppy tiles than the earlier aggressive performance-only settings.

### `src/features/scene/simulation/camera-feed-renderer-utils.ts`

- `L13-L20`: `createFeedRenderer` now creates the feed renderer with:
  `antialias: true`
  `powerPreference: 'high-performance'`
  `stencil: false`
- `L21-L26`: existing `SRGBColorSpace`, `NoToneMapping`, disabled shadows, local clipping, and `setPixelRatio(1)` remain.

Why:
- `antialias: true` improved the visual quality of the feed tiles.
- `powerPreference` and `stencil: false` keep the renderer setup efficient.

### `src/features/scene/simulation/camera-fov-footprints.tsx`

- `L22-L27`: `FovFootprintMeshProps` now includes `quality: FovFootprintQuality`.
- `L37-L44`: added `type FovFootprintQuality = 'full' | 'interaction'`.
- `L88-L131`: split ground contour work from volumetric work:
  `contour` is memoized independently
  `surfaceGeometry` and `lineGeometry` are built in one memo
  `volumeGeometry` and `volumeEdgeGeometry` are built in a second memo gated by `quality === 'full'`
- `L176-L188`: split disposal effects so surface/line and volume/volume-edge geometries are disposed independently.
- `L190-L194`: dashed line distances are now computed only in `quality === 'full'`.
- `L196-L198`: render early-return now only requires `surfaceGeometry` and `lineGeometry`.
- `L202-L233`: volumetric mesh + edge lines render only in `quality === 'full'`.
- `L204-L223`: volumetric mesh and volume edge lines now set `frustumCulled={false}`.
- `L234-L252`: surface mesh now sets `frustumCulled={false}` and uses opacity `0.2` in `full` mode, `0.16` in `interaction` mode.
- `L253-L281`: outline line now sets `frustumCulled={false}` and switches material by quality:
  `full`: `lineDashedMaterial`
  `interaction`: `lineBasicMaterial`
- `L286-L290`: `CameraFovFootprintsProps` now accepts `quality?: FovFootprintQuality`.
- `L293-L297`: `quality = 'full'` default was added.
- `L343-L390`: footprint cache now keys only on:
  camera signature
  `areaRef`
  `obstaclesRef`
- `L347-L390`: cache no longer depends on interaction-specific quality/ray-budget state.
- `L368-L376`: `buildOccludedFovRing` is now always called without interaction-only limits.
- `L395-L401`: `quality` is passed through to `FovFootprintMesh`.

Why:
- The component still supports `interaction` vs `full` drawing, but the ring computation is now cached independently of orbit state.
- `frustumCulled={false}` was added to avoid the footprint vanishing while camera movement changed the view frustum.

Important current behavior:
- The component still supports both `full` and `interaction`.
- The simulation scene now forces `quality='full'`, so orbiting no longer downgrades the FOV appearance.

### `src/features/scene/simulation/simulation-analysis-view.tsx`

- `L623-L624`: added `isThreeViewportVisible = previewViewMode === '3d' && simulationViewMode === 'scene'`.
- `L752-L759`: `LazySimulationCanvas` now receives `isViewportVisible={isThreeViewportVisible}`.
- `L763-L767`: when the 3D viewport is hidden, the canvas is no longer left full-size and transparent.
  It is now collapsed to an invisible offscreen `1px x 1px` element with no pointer events.

Why:
- This prevents paying the full visible-viewport cost while another preview surface is active.

### `src/features/scene/simulation/simulation-canvas.tsx`

- `L20-L29`: tuned the main R3F canvas:
  `dpr` changed to `[1, 1.25]`
  `alpha: false`
  `powerPreference: 'high-performance'`
  `stencil: false`
- `L30-L39`: existing output-color/tone-mapping/shadow initialization remains.

Why:
- This reduced GPU overhead for the main simulation canvas without changing scene functionality.

### `src/features/scene/simulation/simulation-scene.tsx`

- `L48-L51`: added interaction tuning constants:
  `INTERACTION_IDLE_MS = 180`
  `INTERACTION_VISION_TICK_INTERVAL = 1 / 8`
  `INTERACTION_PIXEL_RATIO_CAP = 1`
  `IDLE_PIXEL_RATIO_CAP = 1.25`
- `L81-L91`: `SimulationSceneProps` now requires `isViewportVisible`.
- `L94-L107`: `Lights` now accepts `enableShadows` and only casts the directional-light shadow when enabled.
- `L171-L188`: scene now tracks `interactionStateRef` and `isInteracting`.
- `L353-L357`: `useSimulatedPeople` is now called with `paused: isInteracting`.
- `L362-L364`: added:
  `hasFeedTargets`
  `shouldRenderWorldScene`
  `enableShadows`
- `L379-L390`: added interaction-aware `effectiveVisionTickInterval` and `targetPixelRatio`.
- `L495-L502`: added `markInteractionActive()` to mark orbit/zoom activity and flip `isInteracting`.
- `L512-L518`: added an effect that applies `gl.setPixelRatio(targetPixelRatio)` and `gl.setSize(...)`.
- `L526-L529`: added an effect that flips `gl.shadowMap.enabled` from `enableShadows`.
- `L556-L568`: added an idle timer in `useFrame` to exit interaction mode `180ms` after the last orbit event.
- `L570-L587`: vision-state recomputation now uses `effectiveVisionTickInterval`.
- `L589-L594`: `useCameraFeedRenderers` now receives `paused: isInteracting`.
- `L598-L623`: world scene content is now rendered only when the 3D viewport is visible or feed tiles still need the world scene.
- `L598-L600`: `RealRadarSubscriptionBridge` is now gated by `previewViewMode === '3d' && isViewportVisible`.
- `L624-L630`: `LiveRadarDetectionsMesh` is also gated by `previewViewMode === '3d' && isViewportVisible`.
- `L631-L636`: `PersonTrail` is hidden while interacting.
- `L637-L643`: `CameraFovFootprints` is now gated only by `isViewportVisible` and `collisionCameras.length > 0`, and is passed `quality='full'`.
- `L646-L660`: `OrbitControls` and `FocusController` now render only when the viewport is visible.
- `L648-L657`: `OrbitControls` now binds `onChange`, `onStart`, and `onEnd` to `markInteractionActive`.

Why:
- This is the main 3D interaction-performance patch.
- It reduces pixel ratio, shadow work, feed work, people movement, and vision update frequency while orbiting.
- It also keeps full FOV visible during orbit instead of hiding or downgrading it.

### `src/features/scene/simulation/use-camera-feed-renderers.ts`

- `L130-L140`: added `paused = false` and `paused?: boolean`.
- `L189-L192`: early-return from the render loop when `paused` is true.

Why:
- Feed tiles stop rendering while the main user interaction path is busy orbiting the 3D world.

### `src/features/scene/simulation/use-simulated-people.ts`

- `L25-L33`: added `paused = false` and `paused?: boolean`.
- `L93-L99`: when pausing, reset `accumulator` and `publishTimer` to avoid a catch-up burst after interaction ends.
- `L101-L104`: early-return from the simulation `useFrame` when `paused` is true.

Why:
- People movement is now frozen while orbiting/zooming, which reduces CPU work and position-map churn.

## Porting Notes

- Port `map-view-helpers.ts` before porting any code that relies on configurable FOV-ray limits.
- Port `use-camera-fov-worker.ts`, `use-camera-preview-fov-worker.ts`, and `use-camera-placement.ts` together so the FOV worker split stays coherent.
- Port `simulation-analysis-view.tsx`, `simulation-canvas.tsx`, `simulation-scene.tsx`, `use-camera-feed-renderers.ts`, and `use-simulated-people.ts` together because those changes are tightly coupled.
- Port `camera-fov-footprints.tsx` together with `simulation-scene.tsx` so the full-quality, cached FOV behavior matches the scene wiring.
- Port `camera-feed-helpers.ts` and `camera-feed-renderer-utils.ts` together so the renderer setup matches the new feed scale/FPS assumptions.

## Final Runtime Behavior

- Hidden 3D preview no longer keeps a full visible canvas alive under other preview surfaces.
- Orbiting/zooming pauses camera feeds and people simulation.
- Orbiting/zooming reduces main-canvas pixel ratio and shadow work.
- FOV no longer disappears because of interaction-mode downgrades.
- FOV ring caching is tied to actual camera/world inputs, not orbit state.
- Feed tiles render at higher quality than before.

## Verification

- Verified with `rtk pnpm build`.
