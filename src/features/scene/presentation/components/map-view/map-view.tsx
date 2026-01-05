import 'mapbox-gl/dist/mapbox-gl.css'

import type {FeatureCollection} from 'geojson'
/* @ts-expect-error - MapLayerMouseEvent is not exported by react-map-gl/mapbox */
import type {MapLayerMouseEvent, MapRef} from 'react-map-gl/mapbox'

import React from 'react'
import Map, {Layer, Source} from 'react-map-gl/mapbox'
import {toast} from 'sonner'

import type {GeoPoint} from '@/features/scene/domain/types'
import type {
  CursorPoint,
  TooltipState,
} from '@/features/scene/presentation/components/map-view/map-view-types'

import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {MapViewCursorOverlay} from '@/features/scene/presentation/components/map-view/map-view-cursor-overlay'
import {
  buildAreaFeatureCollection,
  buildOverlapFeatures,
  computeArea,
  computePerimeter,
  computeSegmentLength,
  createPolygonGeometry,
  formatArea,
  formatMeters,
  getNextAreaColor,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {MapViewTooltip} from '@/features/scene/presentation/components/map-view/map-view-tooltip'

interface DrawingState {
  isActive: boolean
  points: GeoPoint[]
}

// eslint-disable-next-line max-lines-per-function
export const MapView: React.FC = () => {
  const mapRef = React.useRef<MapRef | null>(null)
  const [drawing, setDrawing] = React.useState<DrawingState>({
    isActive: false,
    points: [],
  })
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null)
  const [cursorPoint, setCursorPoint] = React.useState<CursorPoint | null>(null)
  const [isNearStart, setIsNearStart] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const initialAreas = useSceneStore((s) => s.scene.areas)
  const [drawingColor, setDrawingColor] = React.useState(
    getNextAreaColor(initialAreas),
  )
  const [previewPath, setPreviewPath] = React.useState<GeoPoint[]>([])

  const activeTool = useUiStore((state) => state.activeTool)
  const isEditMode = useUiStore((state) => state.isEditMode)
  const setActiveTool = useUiStore((state) => state.setActiveTool)

  const areas = useSceneStore((state) => state.scene.areas)
  const activeAreaId = useSceneStore((state) => state.scene.activeAreaId)
  const addArea = useSceneStore((state) => state.addArea)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)

  React.useEffect(() => {
    if (!drawing.isActive) {
      setDrawingColor(getNextAreaColor(areas))
    }
  }, [areas, drawing.isActive])

  React.useEffect(() => {
    if (activeTool !== 'hand') {
      setIsDragging(false)
    }
  }, [activeTool])

  const cursor = React.useMemo(() => {
    if (activeTool === 'draw-area' && isEditMode) {
      return 'none'
    }
    if (activeTool === 'hand') {
      return isDragging ? 'grabbing' : 'grab'
    }
    return undefined
  }, [activeTool, isDragging, isEditMode])

  const resetDrawing = React.useCallback(() => {
    setDrawing({isActive: false, points: []})
    setTooltip(null)
    setIsNearStart(false)
    setPreviewPath([])
  }, [])

  const startPointMode = (point: GeoPoint) => {
    setDrawingColor(getNextAreaColor(areas))
    setDrawing({isActive: true, points: [point]})
  }

  const appendPoint = (point: GeoPoint) => {
    setDrawing((prev) => ({...prev, points: [...prev.points, point]}))
  }

  const handlePointerMove = (event: MapLayerMouseEvent) => {
    setCursorPoint({x: event.point.x, y: event.point.y})
    if (!drawing.isActive) {
      setTooltip(null)
      setPreviewPath([])
      return
    }

    const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
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

    const previewPoints = [...drawing.points, point]
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

    setTooltip({
      text: content,
      x: event.point.x + 12,
      y: event.point.y + 12,
      visible: true,
    })
  }

  const handleBackspace = React.useCallback(() => {
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

  const handleMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'draw-area') {
        return
      }
      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]

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
    [activeTool, appendPoint, drawing, finalizeArea, isEditMode, isNearStart],
  )

  const handleDoubleClick = (event: MapLayerMouseEvent) => {
    event.preventDefault()
    finalizeArea()
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

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }
      if (activeTool !== 'draw-area' || !isEditMode) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        resetDrawing()
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        finalizeArea()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, finalizeArea, handleBackspace, isEditMode, resetDrawing])

  const areaFeatures = React.useMemo(
    () => buildAreaFeatureCollection(areas, activeAreaId),
    [areas, activeAreaId],
  )

  const overlapFeatures = React.useMemo(
    () => buildOverlapFeatures(areas),
    [areas],
  )

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
        mapStyle='mapbox://styles/mapbox/streets-v12'
        ref={mapRef}
        style={{height: '100%', width: '100%'}}
        attributionControl={false}
        cursor={cursor}
        doubleClickZoom={false}
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
        <Source data={areaFeatures} id='areas' type='geojson'>
          <Layer
            id='area-fill'
            type='fill'
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': [
                'case',
                ['boolean', ['get', 'isActive'], false],
                ['+', ['get', 'opacity'], 0.12],
                ['get', 'opacity'],
              ],
            }}
          />
          <Layer
            id='area-outline'
            type='line'
            paint={{
              'line-color': ['get', 'borderColor'],
              'line-width': [
                'case',
                ['boolean', ['get', 'isActive'], false],
                4,
                2,
              ],
            }}
          />
        </Source>

        {overlapFeatures && overlapFeatures.features.length > 0 ? (
          <Source data={overlapFeatures} id='area-overlaps' type='geojson'>
            <Layer
              id='overlap-fill'
              type='fill'
              paint={{
                'fill-color': '#000000',
                'fill-opacity': 0.08,
              }}
            />
            <Layer
              id='overlap-lines'
              type='line'
              paint={{
                'line-color': '#000000',
                'line-width': 1,
                'line-dasharray': [2, 2],
                'line-opacity': 0.4,
              }}
            />
          </Source>
        ) : null}

        {drawingLine ? (
          <Source data={drawingLine} id='drawing-line' type='geojson'>
            <Layer
              id='drawing-outline'
              type='line'
              paint={{
                'line-color': drawingColor,
                'line-width': 2,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        ) : null}

        {drawingPoints ? (
          <Source data={drawingPoints} id='drawing-points' type='geojson'>
            <Layer
              id='drawing-point-layer'
              type='circle'
              paint={{
                'circle-radius': [
                  'case',
                  ['==', ['get', 'role'], 'first'],
                  6,
                  5,
                ],
                'circle-color': '#FFFFFF',
                'circle-stroke-color': drawingColor,
                'circle-stroke-width': 2,
                'circle-blur': 0.2,
              }}
            />
          </Source>
        ) : null}
      </Map>

      {tooltip ? <MapViewTooltip tooltip={tooltip} /> : null}

      {activeTool === 'draw-area' && isEditMode && cursorPoint ? (
        <MapViewCursorOverlay color={drawingColor} cursorPoint={cursorPoint} />
      ) : null}
    </div>
  )
}
