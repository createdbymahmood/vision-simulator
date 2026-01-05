import 'mapbox-gl/dist/mapbox-gl.css'

import type {FeatureCollection} from 'geojson'
/* @ts-expect-error - MapLayerMouseEvent is not exported by react-map-gl/mapbox */
import type {MapLayerMouseEvent, MapRef} from 'react-map-gl/mapbox'

import React from 'react'
import Map from 'react-map-gl/mapbox'
import {toast} from 'sonner'

import type {GeoPoint} from '@/features/scene/domain/types'
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
import {MapViewCursorOverlay} from '@/features/scene/presentation/components/map-view/map-view-cursor-overlay'
import {
  buildAreaFeatureCollection,
  buildOverlapFeatures,
  buildShapeFeatures,
  buildWallFeatures,
  buildWallVertexFeatures,
  computeArea,
  computePerimeter,
  computeSegmentLength,
  createPolygonGeometry,
  formatArea,
  formatMeters,
  getNextAreaColor,
  isPointInsideArea,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {MapViewShapeLayers} from '@/features/scene/presentation/components/map-view/map-view-shape-layers'
import {MapViewTooltip} from '@/features/scene/presentation/components/map-view/map-view-tooltip'
import {MapViewWallLayers} from '@/features/scene/presentation/components/map-view/map-view-wall-layers'
import {useMapViewHotkeys} from '@/features/scene/presentation/components/map-view/use-map-view-hotkeys'
import {useShapeDrawing} from '@/features/scene/presentation/components/map-view/use-shape-drawing'
import {useWallDrawing} from '@/features/scene/presentation/components/map-view/use-wall-drawing'

interface DrawingState {
  isActive: boolean
  points: GeoPoint[]
}

interface MapViewProps {
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
}

const getBaseCursor = (
  activeTool: EditorTool,
  isEditMode: boolean,
  isDragging: boolean,
) => {
  if (activeTool === 'draw-area' && isEditMode) {
    return 'none'
  }
  if (activeTool === 'hand') {
    return isDragging ? 'grabbing' : 'grab'
  }
  if (activeTool === 'select') {
    return 'default'
  }
  if (activeTool === 'draw-wall' || activeTool === 'draw-shape') {
    return 'crosshair'
  }
  return undefined
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const MapView: React.FC<MapViewProps> = ({activeTool, shapeMode}) => {
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

  const isEditMode = useUiStore((state) => state.isEditMode)

  const areas = useSceneStore((state) => state.scene.areas)
  const walls = useSceneStore((state) => state.scene.walls)
  const shapes = useSceneStore((state) => state.scene.shapes)
  const activeAreaId = useSceneStore((state) => state.scene.activeAreaId)
  const addArea = useSceneStore((state) => state.addArea)
  const addWall = useSceneStore((state) => state.addWall)
  const addShape = useSceneStore((state) => state.addShape)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)

  const activeArea = React.useMemo(() => {
    if (!areas.length) return null
    return areas.find((a) => a.id === activeAreaId) ?? areas[0]
  }, [areas, activeAreaId])

  const isGeometryInsideActiveArea = React.useCallback(
    (points: GeoPoint[]) => {
      if (!activeArea) {
        return false
      }
      return points.every((point) => isPointInsideArea(point, activeArea))
    },
    [activeArea],
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
    activeArea,
    addWall,
    isGeometryInsideArea: isGeometryInsideActiveArea,
  })

  const {
    shapeDrawing,
    shapePreview,
    startShape,
    finalizeShape,
    handleShapePointerMove,
    resetShapeDrawing,
  } = useShapeDrawing({
    activeArea,
    addShape,
    isGeometryInsideArea: isGeometryInsideActiveArea,
    strokeColor: SHAPE_STROKE_COLOR,
  })

  React.useEffect(() => {
    if (!drawing.isActive) {
      setDrawingColor(getNextAreaColor(areas))
    }
  }, [activeTool, areas, drawing.isActive])

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
      hasActiveArea: boolean,
      insideActiveArea: boolean,
    ) => {
      if (
        (activeTool === 'draw-wall' || activeTool === 'draw-shape') &&
        !hasActiveArea
      ) {
        setCursorOverride('not-allowed')
        showTooltip('Create an area first', event)
        return true
      }

      if (
        (activeTool === 'draw-wall' || activeTool === 'draw-shape') &&
        !insideActiveArea
      ) {
        setCursorOverride('not-allowed')
        showTooltip('Objects must stay inside an area', event)
        return true
      }
      return false
    },
    [activeTool, showTooltip],
  )

  const handlePointerMove = (event: MapLayerMouseEvent) => {
    setCursorPoint({x: event.point.x, y: event.point.y})
    setCursorOverride(undefined)

    const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
    const hasActiveArea = Boolean(activeArea)
    const insideActiveArea =
      activeTool === 'draw-area' ||
      (hasActiveArea && activeArea
        ? isPointInsideArea(mapPoint, activeArea)
        : false)

    if (!isEditMode) {
      setTooltip(null)
      return
    }

    if (handleAreaPointerMove(event, mapPoint)) {
      return
    }

    if (guardPointerWithinArea(event, hasActiveArea, insideActiveArea)) {
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
  }, [addArea, areas.length, drawing, resetDrawing, setActiveArea])

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

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode) {
        return
      }
      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]

      const isDrawingTool =
        activeTool === 'draw-area' ||
        activeTool === 'draw-wall' ||
        activeTool === 'draw-shape'

      if (!isDrawingTool) {
        return
      }

      if (!activeArea && activeTool !== 'draw-area') {
        toast.info('Create an area first')
        return
      }

      const pointInside =
        activeTool === 'draw-area' || !activeArea
          ? true
          : isPointInsideArea(point, activeArea)
      if (!pointInside) {
        toast.error('Objects must be inside an area')
        return
      }

      if (activeTool === 'draw-area') {
        handleAreaClick(point)
        return
      }

      if (activeTool === 'draw-wall') {
        handleWallClick(point)
        return
      }

      if (activeTool === 'draw-shape') {
        handleShapeClick(point)
      }
    },
    [
      activeArea,
      activeTool,
      handleAreaClick,
      handleShapeClick,
      handleWallClick,
      isEditMode,
    ],
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

  const overlapFeatures = React.useMemo(
    () => buildOverlapFeatures(areas),
    [areas],
  )

  const wallFeatures = React.useMemo(() => buildWallFeatures(walls), [walls])

  const wallVertexFeatures = React.useMemo(
    () => buildWallVertexFeatures(walls),
    [walls],
  )

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

  const shapePreviewFeature: FeatureCollection | null = React.useMemo(() => {
    if (!shapePreview || shapePreview.length < 2) {
      return null
    }
    const isLine = shapeMode === 'line'
    const geometry = isLine
      ? ({
          type: 'LineString',
          coordinates: shapePreview,
        } as unknown as FeatureCollection)
      : ({
          type: 'Polygon',
          coordinates: [shapePreview],
        } as unknown as FeatureCollection)
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {shapeMode},
          geometry,
        },
      ],
    } as unknown as FeatureCollection
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

  return (
    <div className='relative h-full w-full'>
      <Map
        dragPan={activeTool === 'hand'}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        ref={mapRef}
        style={{height: '100%', width: '100%'}}
        attributionControl={false}
        cursor={cursor}
        doubleClickZoom={false}
        dragRotate={false}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        minZoom={10}
        onClick={handleMapClick}
        onDblClick={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onMouseMove={handlePointerMove}
        onMouseUp={handleDragEnd}
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
          wallVertexFeatures={wallVertexFeatures}
        />

        <MapViewShapeLayers
          shapeFeatures={shapeFeatures}
          shapePreviewFeature={shapePreviewFeature}
        />
      </Map>

      {tooltip ? <MapViewTooltip tooltip={tooltip} /> : null}

      {activeTool === 'draw-area' && isEditMode && cursorPoint ? (
        <MapViewCursorOverlay color={drawingColor} cursorPoint={cursorPoint} />
      ) : null}
    </div>
  )
}
