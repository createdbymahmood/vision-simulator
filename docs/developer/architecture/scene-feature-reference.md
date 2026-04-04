# Scene Feature Reference

This reference lists files in `src/features/scene` by section with their file trees and a summary of exported functions/components.

## Components

File tree:
```text
components/
  bottom-navigation-items.tsx
  bottom-navigation.tsx
  editor-layout.tsx
  right-rail.tsx
  top-panel.tsx
  unsaved-changes-leave-dialog.tsx
  viewport-shell.tsx
  properties-sheet/
    area-properties-sheet.tsx
    camera-properties-sheet.tsx
    person-properties-sheet.tsx
    properties-shell.tsx
    shape-properties-sheet.tsx
    wall-properties-sheet.tsx
  editor-dialogs/
    area-management-dialog.tsx
    devices-dialog.tsx
    index.ts
    map-style-dialog.tsx
    place-device-dialog.tsx
    place-dialog-devices.tsx
    search-location-dialog.tsx
```

Exports and purpose:
- `components/bottom-navigation-items.tsx`: `TOOL_ITEM_CLASS` — Constant for tool item class; `ToolButton` — UI component for tool button; `CreateAreaPopover` — UI component for create area popover; `ShapePopover` — UI component for shape popover; `PlacementButtons` — Utility or component for placement buttons.
- `components/bottom-navigation.tsx`: `BottomNavigation` — UI component for bottom navigation.
- `components/editor-layout.tsx`: `EditorLayout` — UI component for editor layout.
- `components/right-rail.tsx`: `RightRail` — UI component for right rail.
- `components/top-panel.tsx`: `TopPanel` — UI component for top panel.
- `components/unsaved-changes-leave-dialog.tsx`: `UnsavedChangesLeaveDialog` — UI component for unsaved changes leave dialog.
- `components/viewport-shell.tsx`: `ViewportShell` — UI component for viewport shell.
- `components/properties-sheet/area-properties-sheet.tsx`: `AreaPropertiesSheet` — UI component for area properties sheet.
- `components/properties-sheet/camera-properties-sheet.tsx`: `CameraPropertiesSheet` — UI component for camera properties sheet.
- `components/properties-sheet/person-properties-sheet.tsx`: `PersonPropertiesSheet` — UI component for person properties sheet.
- `components/properties-sheet/properties-shell.tsx`: `PropertiesDeleteAction` — Utility or component for properties delete action; `PropertiesShell` — UI component for properties shell; `PropertiesSection` — Utility or component for properties section.
- `components/properties-sheet/shape-properties-sheet.tsx`: `ShapePropertiesSheet` — UI component for shape properties sheet.
- `components/properties-sheet/wall-properties-sheet.tsx`: `WallPropertiesSheet` — UI component for wall properties sheet.
- `components/editor-dialogs/area-management-dialog.tsx`: `AreaManagementDialog` — UI component for area management dialog.
- `components/editor-dialogs/devices-dialog.tsx`: `DevicesDialog` — UI component for devices dialog.
- `components/editor-dialogs/index.ts`: `AreaManagementDialog` — UI component for area management dialog; `DevicesDialog` — UI component for devices dialog; `MapStyleDialog` — UI component for map style dialog; `PlaceDeviceDialog` — UI component for place device dialog; `SearchLocationDialog` — UI component for search location dialog.
- `components/editor-dialogs/map-style-dialog.tsx`: `MapStyleDialog` — UI component for map style dialog.
- `components/editor-dialogs/place-device-dialog.tsx`: `DEFAULT_LIST_PARAMS_V2` — Constant for default list params v2; `PlaceDeviceDialog` — UI component for place device dialog.
- `components/editor-dialogs/place-dialog-devices.tsx`: `getVirtualPlaceDeviceOptions` — Helper to get virtual place device options; `getRealPlaceDeviceOptions` — Helper to get real place device options.
- `components/editor-dialogs/search-location-dialog.tsx`: `SearchLocationDialog` — UI component for search location dialog.

## Map

File tree:
```text
map/
  camera-fov-worker-types.ts
  camera-fov.worker.js
  camera-fov.worker.ts
  index.ts
  map-style-urls.ts
  map-view-area-layers.tsx
  map-view-camera-layers.tsx
  map-view-camera-preview-layer.tsx
  map-view-cursor-overlay.tsx
  map-view-helpers.ts
  map-view-people-layers.tsx
  map-view-person-preview-layer.tsx
  map-view-rotation-handle-layer.tsx
  map-view-selection-bounds-layer.tsx
  map-view-selection-handles-layer.tsx
  map-view-shape-layers.tsx
  map-view-tooltip.tsx
  map-view-types.ts
  map-view-wall-layers.tsx
  map-view.tsx
  mapbox-grid-images.ts
  mapbox-grid-style.ts
  selection-geometry.ts
  use-camera-fov-worker.ts
  use-camera-placement.ts
  use-camera-preview-fov-worker.ts
  use-canvas-empty-zoom.ts
  use-fly-to-active-area.ts
  use-map-view-hotkeys.ts
  use-person-placement.ts
  use-selection-transform.ts
  use-shape-drawing.ts
  use-wall-drawing.ts
```

Exports and purpose:
- `map/camera-fov-worker-types.ts`: no runtime exports (types only or side effects).
- `map/camera-fov.worker.js`: no runtime exports (types only or side effects).
- `map/camera-fov.worker.ts`: `bootCameraFovWorker` — Utility or component for boot camera fov worker.
- `map/index.ts`: no runtime exports (types only or side effects).
- `map/map-style-urls.ts`: `MAP_STYLE_URLS` — Constant for map style urls.
- `map/map-view-area-layers.tsx`: `MapViewAreaLayers` — UI component for map view area layers.
- `map/map-view-camera-layers.tsx`: `MapViewCameraLayers` — UI component for map view camera layers.
- `map/map-view-camera-preview-layer.tsx`: `MapViewCameraPreviewLayer` — UI component for map view camera preview layer.
- `map/map-view-cursor-overlay.tsx`: `MapViewCursorOverlay` — UI component for map view cursor overlay.
- `map/map-view-helpers.ts`: `getBaseCursor` — Helper to get base cursor; `closeRing` — Utility or component for close ring; `formatMeters` — Helper to format meters; `formatArea` — Helper to format area; `computePerimeter` — Helper to compute perimeter; `computeArea` — Helper to compute area; `computeSegmentLength` — Helper to compute segment length; `projectPoint` — Utility or component for project point; `createPolygonGeometry` — Helper to create polygon geometry; `computeAngleDeg` — Helper to compute angle deg; `isPointInsideArea` — Utility or component for is point inside area; `createRectangleRing` — Helper to create rectangle ring; `createLineGeometry` — Helper to create line geometry; `createTriangleRing` — Helper to create triangle ring; `createCircleRing` — Helper to create circle ring; `createFovRing` — Helper to create fov ring; `buildFovOcclusionObstacles` — Helper to build fov occlusion obstacles; `isLineOfSightBlockedByObstacles` — Utility or component for is line of sight blocked by obstacles; `buildOccludedFovRing` — Helper to build occluded fov ring; `getNextAreaColor` — Helper to get next area color; `buildAreaFeatureCollection` — Helper to build area feature collection; `getSafeRing` — Helper to get safe ring; `distanceToSegment` — Utility or component for distance to segment; `buildOverlapFeatures` — Helper to build overlap features; `buildWallFeatures` — Helper to build wall features; `buildWallVertexFeatures` — Helper to build wall vertex features; `buildShapeFeatures` — Helper to build shape features; `buildCameraFeatures` — Helper to build camera features; `createCameraLayerDataCache` — Helper to create camera layer data cache; `buildCameraLayerData` — Helper to build camera layer data; `buildPersonFeatures` — Helper to build person features; `getPersonCollision` — Helper to get person collision; `doesWallPathHitPerson` — Utility or component for does wall path hit person; `doesShapeHitPerson` — Utility or component for does shape hit person; `doesWallCollideWithShapes` — Utility or component for does wall collide with shapes; `doesShapeCollideWithWalls` — Utility or component for does shape collide with walls.
- `map/map-view-people-layers.tsx`: `MapViewPeopleLayers` — UI component for map view people layers.
- `map/map-view-person-preview-layer.tsx`: `MapViewPersonPreviewLayer` — UI component for map view person preview layer.
- `map/map-view-rotation-handle-layer.tsx`: `MapViewRotationHandleLayer` — UI component for map view rotation handle layer.
- `map/map-view-selection-bounds-layer.tsx`: `MapViewSelectionBoundsLayer` — UI component for map view selection bounds layer.
- `map/map-view-selection-handles-layer.tsx`: `MapViewSelectionHandlesLayer` — UI component for map view selection handles layer.
- `map/map-view-shape-layers.tsx`: `MapViewShapeLayers` — UI component for map view shape layers.
- `map/map-view-tooltip.tsx`: `MapViewTooltip` — UI component for map view tooltip.
- `map/map-view-types.ts`: no runtime exports (types only or side effects).
- `map/map-view-wall-layers.tsx`: `MapViewWallLayers` — UI component for map view wall layers.
- `map/map-view.tsx`: `MapView` — UI component for map view.
- `map/mapbox-grid-images.ts`: `ensureCanvasGridImages` — Helper to ensure canvas grid images.
- `map/mapbox-grid-style.ts`: `getCanvasGridStyle` — Helper to get canvas grid style.
- `map/selection-geometry.ts`: `HIT_TEST_PRIORITY` — Constant for hit test priority; `getEntityPoints` — Helper to get entity points; `computeBounds` — Helper to compute bounds; `boundsToPolygon` — Utility or component for bounds to polygon; `getBoundsCenter` — Helper to get bounds center; `translatePoints` — Utility or component for translate points; `rotatePoints` — Utility or component for rotate points; `scalePoints` — Utility or component for scale points; `isGeometryInsideArea` — Utility or component for is geometry inside area.
- `map/use-camera-fov-worker.ts`: `useCameraFovWorker` — React hook for camera fov worker.
- `map/use-camera-placement.ts`: `useCameraPlacement` — React hook for camera placement.
- `map/use-camera-preview-fov-worker.ts`: `useCameraPreviewFovWorker` — React hook for camera preview fov worker.
- `map/use-canvas-empty-zoom.ts`: `useCanvasEmptyZoom` — React hook for canvas empty zoom.
- `map/use-fly-to-active-area.ts`: `useFlyToActiveArea` — React hook for fly to active area.
- `map/use-map-view-hotkeys.ts`: `useMapViewHotkeys` — React hook for map view hotkeys.
- `map/use-person-placement.ts`: `usePersonPlacement` — React hook for person placement.
- `map/use-selection-transform.ts`: `HANDLE_LAYER_IDS` — Constant for handle layer ids; `ENTITY_LAYER_IDS` — Constant for entity layer ids; `useSelectionTransform` — React hook for selection transform.
- `map/use-shape-drawing.ts`: `useShapeDrawing` — React hook for shape drawing.
- `map/use-wall-drawing.ts`: `useWallDrawing` — React hook for wall drawing.

## Simulation

File tree:
```text
simulation/
  camera-collision-shape.tsx
  camera-collision-surfaces.tsx
  camera-collision-utils.ts
  camera-collision-wall.tsx
  camera-feed-fov.ts
  camera-feed-helpers.ts
  camera-feed-renderer-utils.ts
  camera-feed-tile-loader.ts
  camera-feed-tile.tsx
  camera-feed-types.ts
  camera-feed-utils.ts
  camera-fov-footprints.tsx
  camera-vision.ts
  entity-meshes.tsx
  ground-plane.tsx
  live-radar-detections-mesh.tsx
  person-trail.tsx
  real-device-feed-player.tsx
  shape-mesh.tsx
  simulation-analysis-view.tsx
  simulation-camera-sidebar.tsx
  simulation-canvas-loader.ts
  simulation-canvas.tsx
  simulation-capture.ts
  simulation-helpers.ts
  simulation-layers.ts
  simulation-people-engine.ts
  simulation-people-utils.ts
  simulation-radar-header.tsx
  simulation-radar-helpers.ts
  simulation-radar-svg.tsx
  simulation-radar.tsx
  simulation-real-radar-activities.tsx
  simulation-scene.tsx
  simulation-textures.ts
  simulation-top-bar.tsx
  simulation-viewport.tsx
  use-camera-feed-renderers.ts
  use-camera-feed-targets.ts
  use-radar-geometry.ts
  use-radar-interactions.ts
  use-radar-trails.ts
  use-simulated-people.ts
  use-simulation-recording.ts
  real-radar/
    real-radar-camera-marker-utils.ts
    real-radar-detection-marker-utils.ts
    real-radar-fov-utils.ts
    real-radar-parsers.ts
    real-radar-subscription-bridge.tsx
    real-radar-types.ts
    simulation-real-radar.css
    simulation-real-radar.tsx
    use-live-radar-state.ts
    use-real-radar-ingestion.ts
    use-real-radar-runtime.ts
```

Exports and purpose:
- `simulation/camera-collision-shape.tsx`: `ShapeCollisionSurface` — Utility or component for shape collision surface.
- `simulation/camera-collision-surfaces.tsx`: `CameraCollisionSurfaces` — Utility or component for camera collision surfaces.
- `simulation/camera-collision-utils.ts`: `getCameraOpticHeight` — Helper to get camera optic height; `createCameraFrustumPlanes` — Helper to create camera frustum planes.
- `simulation/camera-collision-wall.tsx`: `WallCollisionSurface` — Utility or component for wall collision surface.
- `simulation/camera-feed-fov.ts`: `getFeedVerticalFov` — Helper to get feed vertical fov.
- `simulation/camera-feed-helpers.ts`: `MAX_CAMERA_FEEDS` — Constant for max camera feeds; `BASE_FEED_RESOLUTION` — Constant for base feed resolution; `getFeedQualityScale` — Helper to get feed quality scale; `getFeedFps` — Helper to get feed fps; `computeFeedRenderConfig` — Helper to compute feed render config.
- `simulation/camera-feed-renderer-utils.ts`: `createFeedRenderer` — Helper to create feed renderer; `updateFeedCamera` — Utility or component for update feed camera.
- `simulation/camera-feed-tile-loader.ts`: `loadCameraFeedTileModule` — Utility or component for load camera feed tile module.
- `simulation/camera-feed-tile.tsx`: `CameraFeedTile` — UI component for camera feed tile.
- `simulation/camera-feed-types.ts`: no runtime exports (types only or side effects).
- `simulation/camera-feed-utils.ts`: `useElementSize` — React hook for element size; `computeFeedBoundingBoxes` — Helper to compute feed bounding boxes.
- `simulation/camera-fov-footprints.tsx`: `CameraFovFootprints` — Utility or component for camera fov footprints.
- `simulation/camera-vision.ts`: `createCameraVisionFovCache` — Helper to create camera vision fov cache; `buildObstacleSegmentsByArea` — Helper to build obstacle segments by area; `computeCameraVisionState` — Helper to compute camera vision state.
- `simulation/entity-meshes.tsx`: `WallMesh` — UI component for wall mesh; `AreaMesh` — UI component for area mesh; `PersonMesh` — UI component for person mesh; `CameraMesh` — UI component for camera mesh; `EntitiesMesh` — UI component for entities mesh.
- `simulation/ground-plane.tsx`: `GroundPlane` — Utility or component for ground plane.
- `simulation/live-radar-detections-mesh.tsx`: `LiveRadarDetectionsMesh` — UI component for live radar detections mesh.
- `simulation/person-trail.tsx`: `PersonTrail` — Utility or component for person trail.
- `simulation/real-device-feed-player.tsx`: `RealDeviceFeedPlayer` — Utility or component for real device feed player.
- `simulation/shape-mesh.tsx`: `ShapeMesh` — UI component for shape mesh.
- `simulation/simulation-analysis-view.tsx`: `SimulationAnalysisView` — UI component for simulation analysis view.
- `simulation/simulation-camera-sidebar.tsx`: `SimulationCameraSidebar` — UI component for simulation camera sidebar.
- `simulation/simulation-canvas-loader.ts`: `loadSimulationCanvasModule` — Utility or component for load simulation canvas module.
- `simulation/simulation-canvas.tsx`: `SimulationCanvas` — UI component for simulation canvas.
- `simulation/simulation-capture.ts`: no runtime exports (types only or side effects).
- `simulation/simulation-helpers.ts`: `closeRingVectors` — Utility or component for close ring vectors; `getLineShapeGeometryEndpoints` — Helper to get line shape geometry endpoints; `parseColorAndAlpha` — Utility or component for parse color and alpha; `computeSceneOrigin` — Helper to compute scene origin; `createCoordinateTransformer` — Helper to create coordinate transformer; `transformAreaFeatureCollectionsToThreeJSShapes` — Utility or component for transform area feature collections to three jsshapes; `transformWallFeatureCollectionsToThreeJSShapes` — Utility or component for transform wall feature collections to three jsshapes; `transformShapeFeatureCollectionsToThreeJSShapes` — Utility or component for transform shape feature collections to three jsshapes; `transformPeopleFeatureCollectionsToThreeJSShape` — Utility or component for transform people feature collections to three jsshape; `transformCameraFeatureCollectionsToThreeJSShape` — Utility or component for transform camera feature collections to three jsshape; `transformFeatureCollectionsToThreeJSShapes` — Utility or component for transform feature collections to three jsshapes.
- `simulation/simulation-layers.ts`: `WORLD_LAYER` — Constant for world layer; `DEBUG_LAYER` — Constant for debug layer.
- `simulation/simulation-people-engine.ts`: `resolveNextTarget` — Helper to resolve next target; `stepPeopleSimulation` — Utility or component for step people simulation.
- `simulation/simulation-people-utils.ts`: `createRng` — Helper to create rng; `hashId` — Utility or component for hash id; `isPointInPolygon` — Utility or component for is point in polygon; `distanceToSegment` — Utility or component for distance to segment; `getRandomPointInArea` — Helper to get random point in area; `buildAreaPolygons` — Helper to build area polygons; `buildWallSegments` — Helper to build wall segments; `buildAreaBoundarySegments` — Helper to build area boundary segments; `buildShapePolygons` — Helper to build shape polygons.
- `simulation/simulation-radar-header.tsx`: `SimulationRadarHeader` — UI component for simulation radar header.
- `simulation/simulation-radar-helpers.ts`: `clamp` — Utility or component for clamp; `degToRad` — Utility or component for deg to rad; `buildFovGroundRing` — Helper to build fov ground ring.
- `simulation/simulation-radar-svg.tsx`: `SimulationRadarSvg` — Utility or component for simulation radar svg.
- `simulation/simulation-radar.tsx`: `SimulationRadar` — UI component for simulation radar.
- `simulation/simulation-real-radar-activities.tsx`: `SimulationRealRadarActivities` — Utility or component for simulation real radar activities.
- `simulation/simulation-scene.tsx`: `SimulationScene` — Utility or component for simulation scene.
- `simulation/simulation-textures.ts`: `createGridTexture` — Helper to create grid texture; `createMapTexture` — Helper to create map texture.
- `simulation/simulation-top-bar.tsx`: `SimulationTopBar` — UI component for simulation top bar.
- `simulation/simulation-viewport.tsx`: `SimulationViewport` — UI component for simulation viewport.
- `simulation/use-camera-feed-renderers.ts`: `useCameraFeedRenderers` — React hook for camera feed renderers.
- `simulation/use-camera-feed-targets.ts`: `useCameraFeedTargets` — React hook for camera feed targets.
- `simulation/use-radar-geometry.ts`: `useRadarGeometry` — React hook for radar geometry.
- `simulation/use-radar-interactions.ts`: `useRadarInteractions` — React hook for radar interactions.
- `simulation/use-radar-trails.ts`: `useRadarTrails` — React hook for radar trails.
- `simulation/use-simulated-people.ts`: `useSimulatedPeople` — React hook for simulated people.
- `simulation/use-simulation-recording.ts`: `useSimulationRecording` — React hook for simulation recording.
- `simulation/real-radar/real-radar-camera-marker-utils.ts`: `updateCameraMarkerInteractivity` — Utility or component for update camera marker interactivity; `updateCameraMarkerDirection` — Utility or component for update camera marker direction; `createCameraMarkerElement` — Helper to create camera marker element.
- `simulation/real-radar/real-radar-detection-marker-utils.ts`: `detectionIcons` — Utility or component for detection icons; `detectionColors` — Utility or component for detection colors; `updateDetectionMarkerElement` — Utility or component for update detection marker element.
- `simulation/real-radar/real-radar-fov-utils.ts`: `cameraColorForId` — Utility or component for camera color for id; `buildCameraFovFeatures` — Helper to build camera fov features.
- `simulation/real-radar/real-radar-parsers.ts`: `extractRadarMessages` — Utility or component for extract radar messages.
- `simulation/real-radar/real-radar-subscription-bridge.tsx`: `RealRadarSubscriptionBridge` — Utility or component for real radar subscription bridge.
- `simulation/real-radar/real-radar-types.ts`: no runtime exports (types only or side effects).
- `simulation/real-radar/simulation-real-radar.css`: styles for simulation real radar.
- `simulation/real-radar/simulation-real-radar.tsx`: `SimulationRealRadar` — UI component for simulation real radar.
- `simulation/real-radar/use-live-radar-state.ts`: `useLiveRadarState` — React hook for live radar state; `useLiveRadarCameraStates` — React hook for live radar camera states; `useLiveRadarDetections` — React hook for live radar detections; `useLiveRadarUpdatesByTracker` — React hook for live radar updates by tracker.
- `simulation/real-radar/use-real-radar-ingestion.ts`: `useRealRadarIngestion` — React hook for real radar ingestion.
- `simulation/real-radar/use-real-radar-runtime.ts`: `useRealRadarRuntime` — React hook for real radar runtime.

## State

File tree:
```text
state/
  history-actions.ts
  history.store.ts
  scene.store.ts
  ui.store.ts
```

Exports and purpose:
- `state/history-actions.ts`: `describeHistoryAction` — Utility or component for describe history action.
- `state/history.store.ts`: no runtime exports (types only or side effects).
- `state/scene.store.ts`: no runtime exports (types only or side effects).
- `state/ui.store.ts`: no runtime exports (types only or side effects).

## Hooks

File tree:
```text
hooks/
  use-debounced-value.ts
  use-editor-shortcuts.ts
  use-editor-unsaved-changes-guard.ts
  use-frame-scene-update.ts
  use-history-recorder.ts
  use-mapbox-location-search.ts
  use-scene-dirty-state.ts
```

Exports and purpose:
- `hooks/use-debounced-value.ts`: `useDebouncedValue` — React hook for debounced value.
- `hooks/use-editor-shortcuts.ts`: `useEditorShortcuts` — React hook for editor shortcuts.
- `hooks/use-editor-unsaved-changes-guard.ts`: `useEditorUnsavedChangesGuard` — React hook for editor unsaved changes guard.
- `hooks/use-frame-scene-update.ts`: `useFrameSceneUpdate` — React hook for frame scene update.
- `hooks/use-history-recorder.ts`: `useHistoryRecorder` — React hook for history recorder.
- `hooks/use-mapbox-location-search.ts`: `useMapboxLocationSearch` — React hook for mapbox location search.
- `hooks/use-scene-dirty-state.ts`: `useSceneDirtyState` — React hook for scene dirty state.

## Services

File tree:
```text
services/
  area-factory.ts
  camera-factory.ts
  camera-optics.ts
  color-assignment.ts
  id-generator.ts
  scene-factory.ts
  vision-simulator-mode.ts
```

Exports and purpose:
- `services/area-factory.ts`: `createAreaEntity` — Helper to create area entity.
- `services/camera-factory.ts`: `createCameraEntity` — Helper to create camera entity.
- `services/camera-optics.ts`: `DEFAULT_CAMERA_RESOLUTION` — Constant for default camera resolution; `DEFAULT_CAMERA_HORIZONTAL_FOV` — Constant for default camera horizontal fov; `DEFAULT_CAMERA_DEPTH` — Constant for default camera depth; `DEFAULT_CAMERA_ZOOM` — Constant for default camera zoom; `DEFAULT_CAMERA_HEIGHT` — Constant for default camera height; `getCameraAspect` — Helper to get camera aspect; `resolveVerticalFovFromHorizontal` — Helper to resolve vertical fov from horizontal; `resolveHorizontalFovFromVertical` — Helper to resolve horizontal fov from vertical; `resolveBaseHorizontalFov` — Helper to resolve base horizontal fov; `resolveBaseVerticalFov` — Helper to resolve base vertical fov; `resolveCameraZoom` — Helper to resolve camera zoom; `getEffectiveHorizontalFov` — Helper to get effective horizontal fov; `getEffectiveVerticalFov` — Helper to get effective vertical fov; `createDefaultCameraOptics` — Helper to create default camera optics.
- `services/color-assignment.ts`: `assignCameraColor` — Helper to assign camera color.
- `services/id-generator.ts`: `createIdGenerator` — Helper to create id generator.
- `services/scene-factory.ts`: `createInitialScene` — Helper to create initial scene; `touchSceneUpdatedAt` — Utility or component for touch scene updated at.
- `services/vision-simulator-mode.ts`: `DEFAULT_VISION_SIMULATOR_MODE` — Constant for default vision simulator mode; `resolveVisionSimulatorMode` — Helper to resolve vision simulator mode; `getVisionSimulatorModePolicy` — Helper to get vision simulator mode policy.

## Adapters

File tree:
```text
adapters/
  local-storage.scene-persistence.ts
  scene-persistence.port.ts
```

Exports and purpose:
- `adapters/local-storage.scene-persistence.ts`: `createLocalStorageScenePersistence` — Helper to create local storage scene persistence.
- `adapters/scene-persistence.port.ts`: no runtime exports (types only or side effects).

## Utils

File tree:
```text
utils/
  camera-device-features.ts
  scene-export.ts
  scene-serializer.ts
  scene-snapshot-capture.ts
```

Exports and purpose:
- `utils/camera-device-features.ts`: `toCameraSourceFeatures` — Utility or component for to camera source features; `createCameraOpticsFromFeatures` — Helper to create camera optics from features; `createCameraPlacementProfileFromDevice` — Helper to create camera placement profile from device; `mergeCameraFeaturesWithOptics` — Helper to merge camera features with optics; `mergeCameraFeaturesWithCamera` — Helper to merge camera features with camera.
- `utils/scene-export.ts`: `createRecordingFilename` — Helper to create recording filename; `createSnapshotFilename` — Helper to create snapshot filename; `createSceneJsonFilename` — Helper to create scene json filename; `createSceneImageFilename` — Helper to create scene image filename; `downloadBlob` — Utility or component for download blob; `downloadDataUrl` — Utility or component for download data url; `formatRecordingTimer` — Helper to format recording timer.
- `utils/scene-serializer.ts`: `serializeScene` — Helper to serialize scene; `SceneParseError` — Utility or component for scene parse error; `parseScene` — Utility or component for parse scene.
- `utils/scene-snapshot-capture.ts`: `captureSceneSnapshot` — Helper to capture scene snapshot.

## Constants

File tree:
```text
constants/
  area-style.ts
  camera-colors.ts
  person-defaults.ts
  shape-style.ts
  wall-style.ts
```

Exports and purpose:
- `constants/area-style.ts`: `AREA_COLORS` — Constant for area colors; `DEFAULT_AREA_STYLE` — Constant for default area style.
- `constants/camera-colors.ts`: `CAMERA_COLOR_PALETTE` — Constant for camera color palette; `CAMERA_COLOR_HUE_SHIFT_DEGREES` — Constant for camera color hue shift degrees.
- `constants/person-defaults.ts`: `DEFAULT_PERSON_RADIUS` — Constant for default person radius; `DEFAULT_PERSON_HEIGHT` — Constant for default person height; `DEFAULT_PERSON_SPEED` — Constant for default person speed; `createDefaultPerson` — Helper to create default person.
- `constants/shape-style.ts`: `SHAPE_STROKE_COLOR` — Constant for shape stroke color; `SHAPE_FILL_COLOR` — Constant for shape fill color; `DEFAULT_SHAPE_HEIGHT_METERS` — Constant for default shape height meters; `createDefaultShape` — Helper to create default shape.
- `constants/wall-style.ts`: `DEFAULT_WALL_COLOR` — Constant for default wall color; `DEFAULT_WALL_THICKNESS` — Constant for default wall thickness; `createDefaultWall` — Helper to create default wall.

## Types

File tree:
```text
types/
  editor-ui-overrides.ts
  types.ts
  leave-guard/
    types.ts
  editor/
    types.ts
```

Exports and purpose:
- `types/editor-ui-overrides.ts`: no runtime exports (types only or side effects).
- `types/types.ts`: no runtime exports (types only or side effects).
- `types/leave-guard/types.ts`: no runtime exports (types only or side effects).
- `types/editor/types.ts`: no runtime exports (types only or side effects).
