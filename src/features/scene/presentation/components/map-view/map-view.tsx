import type {FeatureCollection, Geometry, LineString, Polygon} from 'geojson'
/* @ts-expect-error - MapLayerMouseEvent is not exported by react-map-gl/mapbox */
import type {MapLayerMouseEvent, MapRef} from 'react-map-gl/mapbox'

import React from 'react'
import Mapbox from 'react-map-gl/mapbox'
import {toast} from 'sonner'

import type {
  AreaEntity,
  GeoPoint,
  PersonEntity,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'
import type {
  CursorPoint,
  TooltipState,
} from '@/features/scene/presentation/components/map-view/map-view-types'
import type {ShapeDrawMode} from '@/features/scene/presentation/types'

import {SHAPE_STROKE_COLOR} from '@/features/scene/domain/constants/shape-style'
import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {MAP_STYLE_URLS} from '@/features/scene/presentation/components/map-view/map-style-urls'
import {MapViewAreaLayers} from '@/features/scene/presentation/components/map-view/map-view-area-layers'
import {MapViewCameraLayers} from '@/features/scene/presentation/components/map-view/map-view-camera-layers'
import {MapViewCameraPreviewLayer} from '@/features/scene/presentation/components/map-view/map-view-camera-preview-layer'
import {MapViewCursorOverlay} from '@/features/scene/presentation/components/map-view/map-view-cursor-overlay'
import {
  buildAreaFeatureCollection,
  buildCameraFeatures,
  buildOverlapFeatures,
  buildPersonFeatures,
  buildShapeFeatures,
  buildWallFeatures,
  computeArea,
  computePerimeter,
  computeSegmentLength,
  createPolygonGeometry,
  formatArea,
  formatMeters,
  getBaseCursor,
  getNextAreaColor,
  isPointInsideArea,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {MapViewPeopleLayers} from '@/features/scene/presentation/components/map-view/map-view-people-layers'
import {MapViewPersonPreviewLayer} from '@/features/scene/presentation/components/map-view/map-view-person-preview-layer'
import {MapViewRotationHandleLayer} from '@/features/scene/presentation/components/map-view/map-view-rotation-handle-layer'
import {MapViewSelectionBoundsLayer} from '@/features/scene/presentation/components/map-view/map-view-selection-bounds-layer'
import {MapViewSelectionHandlesLayer} from '@/features/scene/presentation/components/map-view/map-view-selection-handles-layer'
import {MapViewShapeLayers} from '@/features/scene/presentation/components/map-view/map-view-shape-layers'
import {MapViewTooltip} from '@/features/scene/presentation/components/map-view/map-view-tooltip'
import {MapViewWallLayers} from '@/features/scene/presentation/components/map-view/map-view-wall-layers'
import {ensureCanvasGridImages} from '@/features/scene/presentation/components/map-view/mapbox-grid-images'
import {getCanvasGridStyle} from '@/features/scene/presentation/components/map-view/mapbox-grid-style'
import {useCameraFovWorker} from '@/features/scene/presentation/components/map-view/use-camera-fov-worker'
import {useCameraPlacement} from '@/features/scene/presentation/components/map-view/use-camera-placement'
import {useCanvasEmptyZoom} from '@/features/scene/presentation/components/map-view/use-canvas-empty-zoom'
import {useFlyToActiveArea} from '@/features/scene/presentation/components/map-view/use-fly-to-active-area'
import {useMapViewHotkeys} from '@/features/scene/presentation/components/map-view/use-map-view-hotkeys'
import {usePersonPlacement} from '@/features/scene/presentation/components/map-view/use-person-placement'
import {
  ENTITY_LAYER_IDS,
  HANDLE_LAYER_IDS,
  useSelectionTransform,
} from '@/features/scene/presentation/components/map-view/use-selection-transform'
import {useShapeDrawing} from '@/features/scene/presentation/components/map-view/use-shape-drawing'
import {useWallDrawing} from '@/features/scene/presentation/components/map-view/use-wall-drawing'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

interface DrawingState {
  isActive: boolean
  points: GeoPoint[]
}

interface MapViewProps {
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  onMapReady?: (map: MapRef | null) => void
  peopleOverride?: PersonEntity[]
}

const SHIFT_HAND_ELIGIBLE_TOOLS = new Set<EditorTool>([
  'draw-area',
  'draw-shape',
  'draw-wall',
  'place-camera',
  'place-person',
  'select',
])

const isEditableKeyTarget = (eventTarget: EventTarget | null): boolean => {
  if (!(eventTarget instanceof HTMLElement)) {
    return false
  }

  const tagName = eventTarget.tagName
  return (
    eventTarget.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const MapView: React.FC<MapViewProps> = ({
  activeTool,
  shapeMode,
  onMapReady,
  peopleOverride,
}) => {
  const mapRef = React.useRef<MapRef | null>(null)
  const pointerDownRef = React.useRef(false)
  const pointerMovedWhileDownRef = React.useRef(false)
  const [drawing, setDrawing] = React.useState<DrawingState>({
    isActive: false,
    points: [],
  })
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null)
  const [cursorPoint, setCursorPoint] = React.useState<CursorPoint | null>(null)
  const [isNearStart, setIsNearStart] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [cursorOverride, setCursorOverride] = React.useState<string>()
  const shiftOverrideActiveRef = React.useRef(false)
  const toolBeforeShiftRef = React.useRef<EditorTool | null>(null)
  const activeToolRef = React.useRef(activeTool)
  const isEditModeRef = React.useRef(false)
  const initialAreas = useSceneStore((s) => s.scene.areas)
  const [drawingColor, setDrawingColor] = React.useState(() =>
    getNextAreaColor(initialAreas),
  )
  const [previewPath, setPreviewPath] = React.useState<GeoPoint[]>([])
  const {recordAction} = useHistoryRecorder()

  const isEditMode = useUiStore((state) => state.isEditMode)
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const editorMode = useSceneStore((state) => state.scene.editorMode)
  const mapVisible = useSceneStore((state) => state.scene.mapVisible)
  const mapStyleSetting = useSceneStore((state) => state.scene.meta.mapStyle)

  const areas = useSceneStore((state) => state.scene.areas)
  const walls = useSceneStore((state) => state.scene.walls)
  const shapes = useSceneStore((state) => state.scene.shapes)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const scenePeople = useSceneStore((state) => state.scene.people)
  const people = peopleOverride ?? scenePeople
  const activeAreaId = useSceneStore((state) => state.scene.activeAreaId)
  const addArea = useSceneStore((state) => state.addArea)
  const addWall = useSceneStore((state) => state.addWall)
  const addShape = useSceneStore((state) => state.addShape)
  const addCamera = useSceneStore((state) => state.addCamera)
  const addPerson = useSceneStore((state) => state.addPerson)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const setSelection = useSceneStore((state) => state.setSelection)
  const clearSelection = useSceneStore((state) => state.clearSelection)
  const deleteEntities = useSceneStore((state) => state.deleteEntities)
  const updateScene = useSceneStore((state) => state.updateScene)

  const setActiveTool = useUiStore((state) => state.setActiveTool)
  const cameraPlacement = useUiStore((state) => state.cameraPlacement)
  const setCameraPlacement = useUiStore((state) => state.setCameraPlacement)
  const clearCameraPlacement = useUiStore((state) => state.clearCameraPlacement)
  const openPanel = useUiStore((state) => state.openPanel)
  const flyToActiveAreaTick = useUiStore((state) => state.flyToActiveAreaTick)

  React.useEffect(() => {
    activeToolRef.current = activeTool
  }, [activeTool])

  React.useEffect(() => {
    isEditModeRef.current = isEditMode
  }, [isEditMode])

  const getAreaAtPoint = React.useCallback(
    (point: GeoPoint) =>
      areas.find((area) => isPointInsideArea(point, area)) ?? null,
    [areas],
  )

  const isGeometryInsideArea = React.useCallback(
    (points: GeoPoint[], area: AreaEntity | null) => {
      if (!area) {
        return false
      }
      return points.every((point) => isPointInsideArea(point, area))
    },
    [],
  )

  const {
    wallDrawing,
    wallPreviewPath,
    startWall,
    appendWallPoint,
    popWallPoint,
    finalizeWall,
    resetWallDrawing,
    handleWallPointerMove,
  } = useWallDrawing({
    addWall,
    getAreaForPoint: getAreaAtPoint,
    isGeometryInsideArea,
    people,
    shapes,
  })

  const {
    shapeDrawing,
    shapePreview,
    startShape,
    finalizeShape,
    handleShapePointerMove,
    resetShapeDrawing,
  } = useShapeDrawing({
    addShape,
    getAreaForPoint: getAreaAtPoint,
    isGeometryInsideArea,
    strokeColor: SHAPE_STROKE_COLOR,
    people,
    walls,
  })

  React.useEffect(() => {
    if (!drawing.isActive) {
      setDrawingColor(getNextAreaColor(areas))
    }
  }, [activeTool, areas, drawing.isActive])

  React.useEffect(() => {
    if (activeTool === 'hand' && selectedEntityIds.length > 0) {
      clearSelection()
    }
  }, [activeTool, clearSelection, selectedEntityIds.length])

  React.useEffect(() => {
    if (activeTool !== 'hand' || !drawing.isActive) {
      setIsDragging(false)
    }
  }, [activeTool, drawing.isActive])

  const baseCursor = React.useMemo(
    () => getBaseCursor(activeTool, isEditMode, isDragging),
    [activeTool, isDragging, isEditMode],
  )
  const shouldShowAreaCursorOverlay = isEditMode && activeTool === 'draw-area'

  React.useEffect(() => {
    if (!shouldShowAreaCursorOverlay) {
      setCursorPoint(null)
    }
  }, [shouldShowAreaCursorOverlay])

  const cursor = cursorOverride ?? baseCursor

  const {
    selectionBoundsFeature,
    handleFeatures,
    rotationHandle,
    onPointerMove: handleSelectionPointerMove,
    onMouseDown: handleSelectionMouseDown,
    onMapClick: handleSelectionMapClick,
    onMouseUp: handleSelectionMouseUp,
    onMapLoad: handleSelectionMapLoad,
    mapLoaded,
  } = useSelectionTransform({
    mapRef,
    activeTool,
    isEditMode,
    areas,
    walls,
    shapes,
    cameras,
    people,
    selectedEntityIds,
    setSelection,
    clearSelection,
    updateScene,
    deleteEntities,
    setTooltip,
    setCursorOverride,
    baseCursor,
    openPropertiesForEntity: (entity) => {
      if (entity.type === 'camera') {
        openPanel('camera-properties')
        return
      }
      if (entity.type === 'area') {
        openPanel('area-properties')
        return
      }
      if (entity.type === 'wall') {
        openPanel('wall-properties')
        return
      }
      if (entity.type === 'shape') {
        openPanel('shape-properties')
        return
      }
      if (entity.type === 'person') {
        openPanel('person-properties')
      }
    },
  })

  const {
    preview: cameraPreview,
    onPointerMove: handleCameraPointerMove,
    onMapClick: handleCameraMapClick,
  } = useCameraPlacement({
    activeTool,
    isEditMode,
    areas,
    cameras,
    walls,
    shapes,
    cameraPlacement,
    setCameraPlacement,
    clearCameraPlacement,
    addCamera,
    setSelection,
    setActiveTool,
    openCameraPanel: () => openPanel('camera-properties'),
    setTooltip,
    setCursorOverride,
  })

  const {
    preview: personPreview,
    onPointerMove: handlePersonPointerMove,
    onMapClick: handlePersonMapClick,
  } = usePersonPlacement({
    activeTool,
    isEditMode,
    mapRef,
    areas,
    walls,
    shapes,
    people,
    addPerson,
    setSelection,
    setActiveTool,
    openPersonPanel: () => openPanel('person-properties'),
    setTooltip,
    setCursorOverride,
  })

  const resetDrawing = React.useCallback(() => {
    setDrawing({isActive: false, points: []})
    setTooltip(null)
    setIsNearStart(false)
    setPreviewPath([])
  }, [])

  const startPointMode = React.useCallback(
    (point: GeoPoint) => {
      setDrawingColor(getNextAreaColor(areas))
      setDrawing({isActive: true, points: [point]})
    },
    [areas],
  )
  const appendPoint = React.useCallback((point: GeoPoint) => {
    setDrawing((prev) => ({...prev, points: [...prev.points, point]}))
  }, [])

  const showTooltip = React.useCallback(
    (text: string, event: MapLayerMouseEvent) => {
      setTooltip({
        text,
        x: event.point.x + 12,
        y: event.point.y + 12,
        visible: true,
      })
    },
    [],
  )
  const handleAreaPointerMove = React.useCallback(
    (event: MapLayerMouseEvent, mapPoint: GeoPoint) => {
      if (!(activeTool === 'draw-area' && drawing.isActive)) {
        return false
      }
      const startPoint = drawing.points[0]
      let isClose = false
      if (startPoint && mapRef.current) {
        const startPixel = mapRef.current.project({
          lng: startPoint[0],
          lat: startPoint[1],
        })
        const dx = startPixel.x - event.point.x
        const dy = startPixel.y - event.point.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        isClose = distance <= 10
        setIsNearStart(isClose)
      }

      const previewPoints = [...drawing.points, mapPoint]
      const extendedPreview =
        isClose && previewPoints.length > 0
          ? [...previewPoints, previewPoints[0]]
          : previewPoints
      setPreviewPath(extendedPreview)

      const segmentLength = computeSegmentLength(previewPoints)
      const totalLength = computePerimeter(previewPoints)
      const content =
        previewPoints.length >= 3 && isNearStart
          ? `Click to close | Total: ${formatMeters(totalLength)}`
          : previewPoints.length >= 3
            ? `${formatMeters(segmentLength)} • Total: ${formatMeters(totalLength)}`
            : `${formatMeters(segmentLength)}`

      showTooltip(content, event)
      return true
    },
    [activeTool, drawing.isActive, drawing.points, isNearStart, showTooltip],
  )

  const handleWallPointer = React.useCallback(
    (event: MapLayerMouseEvent, mapPoint: GeoPoint) => {
      const result = handleWallPointerMove(mapPoint, {
        x: event.point.x,
        y: event.point.y,
      })
      if (result?.cursor) {
        setCursorOverride(result.cursor)
      }
      setTooltip(result?.tooltip ?? null)
      return true
    },
    [handleWallPointerMove],
  )

  const handleShapePointer = React.useCallback(
    (event: MapLayerMouseEvent, mapPoint: GeoPoint) => {
      const result = handleShapePointerMove(
        mapPoint,
        {x: event.point.x, y: event.point.y},
        shapeMode,
        {
          shiftKey: Boolean(
            (event.originalEvent as MouseEvent | undefined)?.shiftKey,
          ),
          altKey: Boolean(
            (event.originalEvent as MouseEvent | undefined)?.altKey,
          ),
        },
      )
      if (result?.cursor) {
        setCursorOverride(result.cursor)
      }
      setTooltip(result?.tooltip ?? null)
      return true
    },
    [handleShapePointerMove, shapeMode],
  )

  const guardPointerWithinArea = React.useCallback(
    (
      event: MapLayerMouseEvent,
      hasAreas: boolean,
      areaAtPoint: AreaEntity | null,
    ) => {
      if (
        (activeTool === 'draw-wall' || activeTool === 'draw-shape') &&
        !hasAreas
      ) {
        setCursorOverride('not-allowed')
        showTooltip('Create an area first', event)
        return true
      }

      if (
        (activeTool === 'draw-wall' || activeTool === 'draw-shape') &&
        !areaAtPoint
      ) {
        setCursorOverride('not-allowed')
        showTooltip('Objects must stay inside an area', event)
        return true
      }
      return false
    },
    [activeTool, showTooltip],
  )

  const updateCursorPointForOverlay = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!shouldShowAreaCursorOverlay) {
        return
      }
      setCursorPoint({x: event.point.x, y: event.point.y})
    },
    [shouldShowAreaCursorOverlay],
  )

  const handleMouseDown = React.useCallback(
    (event: MapLayerMouseEvent) => {
      pointerDownRef.current = true
      pointerMovedWhileDownRef.current = false
      handleSelectionMouseDown(event)

      if (
        !isEditMode ||
        activeTool !== 'draw-shape' ||
        shapeMode === 'triangle' ||
        shapeDrawing.isActive
      ) {
        return
      }

      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      startShape(point)
    },
    [
      activeTool,
      handleSelectionMouseDown,
      isEditMode,
      shapeMode,
      shapeDrawing.isActive,
      startShape,
    ],
  )

  const handleMouseUp = React.useCallback(
    (event: MapLayerMouseEvent) => {
      pointerDownRef.current = false
      handleSelectionMouseUp()
      if (isDragging) {
        setIsDragging(false)
      }

      if (
        !isEditMode ||
        activeTool !== 'draw-shape' ||
        shapeMode === 'triangle' ||
        !shapeDrawing.isActive
      ) {
        return
      }

      const didDrag = pointerMovedWhileDownRef.current
      pointerMovedWhileDownRef.current = false
      if (!didDrag) {
        resetShapeDrawing()
        return
      }

      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      finalizeShape(point, shapeMode)
    },
    [
      activeTool,
      finalizeShape,
      handleSelectionMouseUp,
      isDragging,
      isEditMode,
      resetShapeDrawing,
      shapeDrawing.isActive,
      shapeMode,
    ],
  )

  const handlePointerMove = (event: MapLayerMouseEvent) => {
    if (pointerDownRef.current) {
      pointerMovedWhileDownRef.current = true
    }
    updateCursorPointForOverlay(event)

    if (handleSelectionPointerMove(event)) {
      return
    }

    const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
    const hasAreas = areas.length > 0
    const areaAtPoint = getAreaAtPoint(mapPoint)

    setCursorOverride(undefined)

    if (!isEditMode) {
      setTooltip(null)
      return
    }

    if (activeTool === 'place-camera') {
      if (handleCameraPointerMove(event)) {
        return
      }
    }
    if (activeTool === 'place-person') {
      if (handlePersonPointerMove(event)) {
        return
      }
    }

    if (handleAreaPointerMove(event, mapPoint)) {
      return
    }

    if (guardPointerWithinArea(event, hasAreas, areaAtPoint)) {
      return
    }

    if (activeTool === 'draw-wall' && handleWallPointer(event, mapPoint)) {
      return
    }

    if (activeTool === 'draw-shape' && handleShapePointer(event, mapPoint)) {
      return
    }

    setTooltip(null)
    setPreviewPath([])
  }

  const handleAreaBackspace = React.useCallback(() => {
    if (!drawing.isActive) {
      return
    }
    setDrawing((prev) => {
      const nextPoints = prev.points.slice(0, -1)
      return {...prev, points: nextPoints, isActive: nextPoints.length > 0}
    })
  }, [drawing.isActive])

  const finalizeArea = React.useCallback(() => {
    if (!drawing.isActive) {
      return
    }

    const hasMinimum = drawing.points.length >= 3
    if (!hasMinimum) {
      toast.info('Need at least 3 vertices to close the area')
      return
    }

    const geometry = createPolygonGeometry(drawing.points)
    const perimeter = computePerimeter(geometry.coordinates)
    const areaValue = computeArea(geometry.coordinates)

    const updatedScene = addArea(geometry)
    recordAction({type: 'add', entity: 'area'}, updatedScene)
    const lastArea = updatedScene.areas.at(-1)
    if (lastArea) {
      setActiveArea(lastArea.id)
    }

    const isFirstArea = areas.length === 0
    const message = isFirstArea
      ? `✓ Area created! You can now place objects inside. Perimeter: ${formatMeters(perimeter)} • Area: ${formatArea(areaValue)}`
      : `Area created • Perimeter: ${formatMeters(perimeter)} • Area: ${formatArea(areaValue)}`

    toast.success(message)

    resetDrawing()
  }, [
    addArea,
    areas.length,
    drawing,
    recordAction,
    resetDrawing,
    setActiveArea,
  ])

  const completeWallDrawing = React.useCallback(() => {
    const updated = finalizeWall()
    const createdWallId = updated?.walls.at(-1)?.id
    if (!createdWallId) {
      return
    }
    setSelection([createdWallId])
    openPanel('wall-properties')
  }, [finalizeWall, openPanel, setSelection])

  useMapViewHotkeys({
    // NOTE: Shortcuts are intentionally disabled for now. Do not re-enable
    // this without an explicit product request.
    enabled: false,
    activeTool,
    isEditMode,
    wallDrawingActive: wallDrawing.isActive,
    shapeDrawingActive: shapeDrawing.isActive,
    onEscape: () => {
      resetDrawing()
      resetWallDrawing()
      resetShapeDrawing()
      setTooltip(null)
    },
    onAreaBackspace: handleAreaBackspace,
    onAreaEnter: finalizeArea,
    onWallBackspace: popWallPoint,
    onWallEnter: completeWallDrawing,
    onShapeBackspace: resetShapeDrawing,
  })

  React.useEffect(() => {
    const restoreToolAfterShift = () => {
      if (!shiftOverrideActiveRef.current) {
        return
      }

      const toolBeforeShift = toolBeforeShiftRef.current
      shiftOverrideActiveRef.current = false
      toolBeforeShiftRef.current = null

      if (!toolBeforeShift) {
        return
      }

      if (activeToolRef.current !== 'hand') {
        return
      }

      setActiveTool(toolBeforeShift)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || event.repeat) {
        return
      }

      if (isEditableKeyTarget(event.target)) {
        return
      }

      if (shiftOverrideActiveRef.current || !isEditModeRef.current) {
        return
      }

      const currentTool = activeToolRef.current
      if (!SHIFT_HAND_ELIGIBLE_TOOLS.has(currentTool)) {
        return
      }

      toolBeforeShiftRef.current = currentTool
      shiftOverrideActiveRef.current = true
      setActiveTool('hand')
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Shift') {
        return
      }
      restoreToolAfterShift()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', restoreToolAfterShift)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', restoreToolAfterShift)
      restoreToolAfterShift()
    }
  }, [setActiveTool])

  const handleAreaClick = React.useCallback(
    (point: GeoPoint) => {
      const canClose = drawing.points.length >= 3
      if (drawing.isActive && isNearStart && canClose) {
        finalizeArea()
        return
      }

      if (!drawing.isActive) {
        startPointMode(point)
        return
      }

      appendPoint(point)
    },
    [
      appendPoint,
      drawing.isActive,
      drawing.points.length,
      finalizeArea,
      isNearStart,
      startPointMode,
    ],
  )

  const handleWallClick = React.useCallback(
    (point: GeoPoint) => {
      if (!wallDrawing.isActive) {
        startWall(point)
        setTooltip(null)
        return
      }
      appendWallPoint(point)
    },
    [appendWallPoint, setTooltip, startWall, wallDrawing.isActive],
  )

  const handleShapeClick = React.useCallback(
    (point: GeoPoint) => {
      if (shapeMode !== 'triangle') {
        return
      }
      if (!shapeDrawing.isActive) {
        startShape(point)
        return
      }
      finalizeShape(point, shapeMode)
    },
    [finalizeShape, shapeDrawing.isActive, shapeMode, startShape],
  )

  const handlePlacementMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (activeTool === 'place-camera') {
        return handleCameraMapClick(event)
      }
      if (activeTool === 'place-person') {
        return handlePersonMapClick(event)
      }
      return false
    },
    [activeTool, handleCameraMapClick, handlePersonMapClick],
  )

  const handleDrawingToolClick = React.useCallback(
    (point: GeoPoint) => {
      const isDrawingTool =
        activeTool === 'draw-area' ||
        activeTool === 'draw-wall' ||
        activeTool === 'draw-shape'

      if (!isDrawingTool) {
        return false
      }

      if (areas.length === 0 && activeTool !== 'draw-area') {
        toast.info('Create an area first')
        return true
      }

      const areaAtPoint = getAreaAtPoint(point)
      const pointInside = activeTool === 'draw-area' || Boolean(areaAtPoint)
      if (!pointInside) {
        toast.error('Objects must be inside an area')
        return true
      }

      if (activeTool === 'draw-area') {
        handleAreaClick(point)
        return true
      }

      if (activeTool === 'draw-wall') {
        handleWallClick(point)
        return true
      }

      if (activeTool === 'draw-shape') {
        handleShapeClick(point)
        return true
      }

      return false
    },
    [
      activeTool,
      areas.length,
      getAreaAtPoint,
      handleAreaClick,
      handleShapeClick,
      handleWallClick,
    ],
  )

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (handleSelectionMapClick(event)) {
        return
      }

      if (!isEditMode) {
        return
      }
      if (handlePlacementMapClick(event)) {
        return
      }

      if (activeTool === 'hand') {
        clearSelection()
        return
      }

      if (activeTool === 'draw-shape' && shapeMode !== 'triangle') {
        return
      }

      const clickDetail =
        (event.originalEvent as MouseEvent | undefined)?.detail ?? 1
      if (
        clickDetail > 1 &&
        (activeTool === 'draw-area' ||
          activeTool === 'draw-wall' ||
          activeTool === 'draw-shape')
      ) {
        return
      }

      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      handleDrawingToolClick(point)
    },
    [
      activeTool,
      clearSelection,
      handleDrawingToolClick,
      handlePlacementMapClick,
      handleSelectionMapClick,
      isEditMode,
      shapeMode,
    ],
  )

  const handleMapLoad = React.useCallback(() => {
    handleSelectionMapLoad()
  }, [handleSelectionMapLoad])

  React.useEffect(() => {
    if (!mapLoaded) {
      return
    }
    const map = mapRef.current?.getMap?.() ?? null
    if (!map) {
      return
    }

    const handleStyleLoad = () => {
      ensureCanvasGridImages(map)
    }

    map.on('style.load', handleStyleLoad)
    if (map.isStyleLoaded()) {
      ensureCanvasGridImages(map)
    }

    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [mapLoaded])

  React.useEffect(() => {
    if (!onMapReady || !mapLoaded) {
      return
    }
    onMapReady(mapRef.current)
  }, [mapLoaded, onMapReady])

  React.useEffect(
    () => () => {
      if (onMapReady) {
        onMapReady(null)
      }
    },
    [onMapReady],
  )

  const handleDoubleClick = (event: MapLayerMouseEvent) => {
    event.preventDefault()
    if (activeTool === 'draw-wall') {
      completeWallDrawing()
      return
    }
    if (activeTool === 'draw-area') {
      finalizeArea()
    }
  }

  const handleDragStart = () => {
    if (activeTool === 'hand') {
      setIsDragging(true)
    }
  }

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  const areaFeatures = React.useMemo(
    () => buildAreaFeatureCollection(areas, activeAreaId),
    [areas, activeAreaId],
  )

  useFlyToActiveArea({
    mapRef,
    mapLoaded,
    activeAreaId,
    areas,
    flyToActiveAreaTick,
  })

  const {initialZoom} = useCanvasEmptyZoom({
    mapRef,
    mapLoaded,
    editorMode,
    areaCount: areas.length,
  })

  const overlapFeatures = React.useMemo(
    () => buildOverlapFeatures(areas),
    [areas],
  )

  const wallFeatures = React.useMemo(() => buildWallFeatures(walls), [walls])

  const wallPreviewFeature: FeatureCollection | null = React.useMemo(() => {
    if (!wallDrawing.isActive || wallPreviewPath.length < 2) {
      return null
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            color: DEFAULT_WALL_COLOR,
            thickness: DEFAULT_WALL_THICKNESS,
          },
          geometry: {type: 'LineString', coordinates: wallPreviewPath},
        },
      ],
    }
  }, [wallDrawing.isActive, wallPreviewPath])

  const shapeFeatures = React.useMemo(
    () => buildShapeFeatures(shapes),
    [shapes],
  )

  const cameraFovData = useCameraFovWorker({
    cameras,
    areas,
    walls,
    shapes,
  })

  const cameraLayerData = React.useMemo(() => {
    return {
      points: buildCameraFeatures(cameras),
      fovs: cameraFovData.fovs,
      directions: cameraFovData.directions,
    }
  }, [cameraFovData.directions, cameraFovData.fovs, cameras])

  const personFeatures = React.useMemo(
    () => buildPersonFeatures(people),
    [people],
  )

  const shapePreviewFeature: FeatureCollection | null = React.useMemo(() => {
    if (!shapePreview || shapePreview.length < 2) {
      return null
    }
    const isLine =
      shapeMode === 'line' ||
      (shapeMode === 'triangle' && shapePreview.length < 4)
    const geometry: LineString | Polygon = isLine
      ? {
          type: 'LineString',
          coordinates: shapePreview,
        }
      : {
          type: 'Polygon',
          coordinates: [shapePreview as GeoPoint[]],
        }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {shapeMode},
          geometry,
        },
      ],
    } as FeatureCollection<Geometry>
  }, [shapeMode, shapePreview])

  const drawingLine: FeatureCollection | null = React.useMemo(() => {
    if (!drawing.isActive || previewPath.length === 0) {
      return null
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {type: 'LineString', coordinates: previewPath},
        },
      ],
    }
  }, [drawing, previewPath])

  const drawingPoints: FeatureCollection | null = React.useMemo(() => {
    if (!drawing.isActive) {
      return null
    }
    return {
      type: 'FeatureCollection',
      features: drawing.points.map((point, index) => ({
        type: 'Feature',
        properties: {role: index === 0 ? 'first' : 'vertex'},
        geometry: {type: 'Point', coordinates: point},
      })),
    }
  }, [drawing])

  const canvasGridStyle = React.useMemo(() => getCanvasGridStyle(), [])
  const mapStyle =
    editorMode === 'canvas'
      ? canvasGridStyle
      : mapVisible
        ? MAP_STYLE_URLS[mapStyleSetting]
        : undefined
  const mapStyleProps = mapStyle ? {mapStyle} : {}
  return (
    <div className='vs:relative vs:h-full vs:w-full'>
      <Mapbox
        preserveDrawingBuffer
        dragPan={activeTool === 'hand'}
        interactiveLayerIds={[...ENTITY_LAYER_IDS, ...HANDLE_LAYER_IDS]}
        {...mapStyleProps}
        ref={mapRef}
        style={{height: '100%', width: '100%'}}
        attributionControl={false}
        boxZoom={false}
        cursor={cursor}
        doubleClickZoom={false}
        dragRotate={false}
        mapboxAccessToken={mapboxToken}
        minZoom={2}
        onClick={handleMapClick}
        onDblClick={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onLoad={handleMapLoad}
        onMouseDown={handleMouseDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handleMouseUp}
        projection='mercator'
        initialViewState={{
          latitude: 34.052235,
          longitude: -118.243683,
          zoom: initialZoom,
        }}
      >
        <MapViewAreaLayers
          areaFeatures={areaFeatures}
          drawingLine={drawingLine}
          drawingColor={drawingColor}
          drawingPoints={drawingPoints}
          overlapFeatures={overlapFeatures}
        />

        <MapViewWallLayers
          wallFeatures={wallFeatures}
          wallPreviewFeature={wallPreviewFeature}
        />

        <MapViewShapeLayers
          shapeFeatures={shapeFeatures}
          shapePreviewFeature={shapePreviewFeature}
        />

        {personPreview ? (
          <MapViewPersonPreviewLayer
            circle={personPreview.circle}
            isValid={personPreview.isValid}
            point={personPreview.point}
          />
        ) : null}

        {cameraPreview ? (
          <MapViewCameraPreviewLayer
            isValid={cameraPreview.isValid}
            previewRange={cameraPreview.range}
            previewFov={cameraPreview.fov}
            previewPoint={cameraPreview.point}
          />
        ) : null}

        <MapViewCameraLayers data={cameraLayerData} />
        <MapViewPeopleLayers personFeatures={personFeatures} />

        <MapViewSelectionBoundsLayer
          selectionBoundsFeature={selectionBoundsFeature}
        />

        <MapViewRotationHandleLayer rotationHandle={rotationHandle} />

        <MapViewSelectionHandlesLayer
          handleFeatures={handleFeatures}
          mapLoaded={mapLoaded}
        />
      </Mapbox>

      {tooltip ? <MapViewTooltip tooltip={tooltip} /> : null}

      {shouldShowAreaCursorOverlay && cursorPoint ? (
        <MapViewCursorOverlay color={drawingColor} cursorPoint={cursorPoint} />
      ) : null}
    </div>
  )
}
