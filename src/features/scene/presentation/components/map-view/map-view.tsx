import 'mapbox-gl/dist/mapbox-gl.css'

import type {FeatureCollection, Geometry, LineString, Polygon} from 'geojson'
/* @ts-expect-error - MapLayerMouseEvent is not exported by react-map-gl/mapbox */
import type {MapLayerMouseEvent, MapRef} from 'react-map-gl/mapbox'

import React from 'react'
import Mapbox from 'react-map-gl/mapbox'
import {toast} from 'sonner'

import type {
  AreaEntity,
  GeoPoint,
  SceneMapStyle,
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
import {MapViewAreaLayers} from '@/features/scene/presentation/components/map-view/map-view-area-layers'
import {MapViewCameraLayers} from '@/features/scene/presentation/components/map-view/map-view-camera-layers'
import {MapViewCameraPreviewLayer} from '@/features/scene/presentation/components/map-view/map-view-camera-preview-layer'
import {MapViewCursorOverlay} from '@/features/scene/presentation/components/map-view/map-view-cursor-overlay'
import {
  buildAreaFeatureCollection,
  buildCameraLayerData,
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
import {SelectionOverlay} from '@/features/scene/presentation/components/map-view/selection-overlay'
import {useCameraPlacement} from '@/features/scene/presentation/components/map-view/use-camera-placement'
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
}

const MAP_STYLE_URLS: Record<SceneMapStyle, string> = {
  street: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  traffic: 'mapbox://styles/mapbox/traffic-day-v2',
  osm: 'mapbox://styles/mapbox/outdoors-v12',
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const MapView: React.FC<MapViewProps> = ({
  activeTool,
  shapeMode,
  onMapReady,
}) => {
  const mapRef = React.useRef<MapRef | null>(null)
  const [drawing, setDrawing] = React.useState<DrawingState>({
    isActive: false,
    points: [],
  })
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null)
  const [cursorPoint, setCursorPoint] = React.useState<CursorPoint | null>(null)
  const [isNearStart, setIsNearStart] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [cursorOverride, setCursorOverride] = React.useState<string>()
  const initialAreas = useSceneStore((s) => s.scene.areas)
  const [drawingColor, setDrawingColor] = React.useState(() =>
    getNextAreaColor(initialAreas),
  )
  const [previewPath, setPreviewPath] = React.useState<GeoPoint[]>([])
  const {recordAction} = useHistoryRecorder()

  const isEditMode = useUiStore((state) => state.isEditMode)
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const sceneMode = useSceneStore((state) => state.scene.mode)
  const mapVisible = useSceneStore((state) => state.scene.mapVisible)
  const mapStyleSetting = useSceneStore((state) => state.scene.meta.mapStyle)

  const areas = useSceneStore((state) => state.scene.areas)
  const walls = useSceneStore((state) => state.scene.walls)
  const shapes = useSceneStore((state) => state.scene.shapes)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const people = useSceneStore((state) => state.scene.people)
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

  const cursor = cursorOverride ?? baseCursor

  const {
    selectionBoundsFeature,
    handleFeatures,
    rotationHandle,
    selectionCount,
    onPointerMove: handleSelectionPointerMove,
    onMouseDown: handleSelectionMouseDown,
    onMapClick: handleSelectionMapClick,
    onMouseUp: handleSelectionMouseUp,
    onMapLoad: handleSelectionMapLoad,
    onDeleteSelection,
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
  const handleMouseDown = (event: MapLayerMouseEvent) => {
    handleSelectionMouseDown(event)
  }

  const handleMouseUp = () => {
    handleSelectionMouseUp()
    if (isDragging) {
      setIsDragging(false)
    }
  }

  const handlePointerMove = (event: MapLayerMouseEvent) => {
    setCursorPoint({x: event.point.x, y: event.point.y})

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

  useMapViewHotkeys({
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
    onWallEnter: finalizeWall,
    onShapeBackspace: resetShapeDrawing,
  })

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
      finalizeWall()
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

  const cameraLayerData = React.useMemo(
    () => buildCameraLayerData(cameras, areas, walls, shapes),
    [areas, cameras, shapes, walls],
  )

  const personFeatures = React.useMemo(
    () => buildPersonFeatures(people),
    [people],
  )

  const shapePreviewFeature: FeatureCollection | null = React.useMemo(() => {
    if (!shapePreview || shapePreview.length < 2) {
      return null
    }
    const isLine = shapeMode === 'line'
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
    sceneMode === 'canvas'
      ? canvasGridStyle
      : mapVisible
        ? MAP_STYLE_URLS[mapStyleSetting]
        : undefined
  const mapStyleProps = mapStyle ? {mapStyle} : {}

  return (
    <div className='relative h-full w-full'>
      <Mapbox
        preserveDrawingBuffer
        dragPan={activeTool === 'hand'}
        interactiveLayerIds={[...ENTITY_LAYER_IDS, ...HANDLE_LAYER_IDS]}
        {...mapStyleProps}
        ref={mapRef}
        style={{height: '100%', width: '100%'}}
        attributionControl={false}
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
          zoom: 10,
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

      <SelectionOverlay
        count={selectionCount}
        isEditMode={isEditMode}
        onDelete={onDeleteSelection}
      />

      {tooltip ? <MapViewTooltip tooltip={tooltip} /> : null}

      {activeTool === 'draw-area' && isEditMode && cursorPoint ? (
        <MapViewCursorOverlay color={drawingColor} cursorPoint={cursorPoint} />
      ) : null}
    </div>
  )
}
