import 'mapbox-gl/dist/mapbox-gl.css'

import type {
  FeatureCollection,
  Geometry,
  LineString,
  Point,
  Polygon,
} from 'geojson'
/* @ts-expect-error - MapLayerMouseEvent is not exported by react-map-gl/mapbox */
import type {MapLayerMouseEvent, MapRef} from 'react-map-gl/mapbox'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {
  booleanPointInPolygon,
  point as turfPoint,
  polygon as turfPolygon,
} from '@turf/turf'
import React from 'react'
import Mapbox, {Layer, Source} from 'react-map-gl/mapbox'
import {toast} from 'sonner'

import type {
  GeoPoint,
  PersonEntity,
  SceneEntity,
  SceneRoot,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'
import type {
  CursorPoint,
  TooltipState,
} from '@/features/scene/presentation/components/map-view/map-view-types'
import type {Bounds} from '@/features/scene/presentation/components/map-view/selection-geometry'
import type {ShapeDrawMode} from '@/features/scene/presentation/types'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {SHAPE_STROKE_COLOR} from '@/features/scene/domain/constants/shape-style'
import {
  DEFAULT_WALL_COLOR,
  DEFAULT_WALL_THICKNESS,
} from '@/features/scene/domain/constants/wall-style'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {MapViewAreaLayers} from '@/features/scene/presentation/components/map-view/map-view-area-layers'
import {MapViewCameraLayers} from '@/features/scene/presentation/components/map-view/map-view-camera-layers'
import {MapViewCursorOverlay} from '@/features/scene/presentation/components/map-view/map-view-cursor-overlay'
import {
  buildAreaFeatureCollection,
  buildCameraFeatures,
  buildOverlapFeatures,
  buildPersonFeatures,
  buildShapeFeatures,
  buildWallFeatures,
  buildWallVertexFeatures,
  closeRing,
  computeArea,
  computePerimeter,
  computeSegmentLength,
  createPolygonGeometry,
  formatArea,
  formatMeters,
  getNextAreaColor,
  isPointInsideArea,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {MapViewPeopleLayers} from '@/features/scene/presentation/components/map-view/map-view-people-layers'
import {MapViewShapeLayers} from '@/features/scene/presentation/components/map-view/map-view-shape-layers'
import {MapViewTooltip} from '@/features/scene/presentation/components/map-view/map-view-tooltip'
import {MapViewWallLayers} from '@/features/scene/presentation/components/map-view/map-view-wall-layers'
import {
  boundsToPolygon,
  computeBounds,
  getBoundsCenter,
  getEntityPoints,
  HIT_TEST_PRIORITY,
  isGeometryInsideArea as isGeometryInsideAreaSelection,
  rotatePoints,
  scalePoints,
  translatePoints,
} from '@/features/scene/presentation/components/map-view/selection-geometry'
import {useMapViewHotkeys} from '@/features/scene/presentation/components/map-view/use-map-view-hotkeys'
import {useShapeDrawing} from '@/features/scene/presentation/components/map-view/use-shape-drawing'
import {useWallDrawing} from '@/features/scene/presentation/components/map-view/use-wall-drawing'

interface DrawingState {
  isActive: boolean
  points: GeoPoint[]
}

interface TransformSession {
  type: 'move' | 'resize' | 'rotate'
  handleType?: string
  startPoint: GeoPoint
  origin?: GeoPoint
  originalGeometries: Record<string, GeoPoint[]>
  originalBounds?: Bounds | null
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

const ROTATE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%232563EB' d='M12 2v3l4-4-4-4v3C6.486 0 2 4.486 2 10s4.486 10 10 10 10-4.486 10-10h-2c0 4.411-3.589 8-8 8S4 14.411 4 10 7.589 2 12 2z'/%3E%3C/svg%3E\") 12 12, auto"

const ensureHandleImages = (map: any) => {
  if (!map || typeof map.hasImage !== 'function') {
    return
  }
  if (!map.hasImage('handle-square')) {
    const size = 14
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(2, 2, size - 4, size - 4)
      ctx.strokeStyle = '#2563EB'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, size - 4, size - 4)
      const imageData = ctx.getImageData(0, 0, size, size)
      map.addImage('handle-square', imageData, {pixelRatio: 2})
    }
  }
}

const HANDLE_LAYER_IDS = [
  'selection-rotation-handle',
  'selection-handles-corner',
  'selection-handles-edge',
]

const ENTITY_LAYER_IDS = [
  'people-fill',
  'camera-fill',
  'wall-lines',
  'shape-outline',
  'shape-line',
  'shape-fill',
  'area-fill',
]

const LAYER_TYPE_MAP: Record<string, string> = {
  'people-fill': 'person',
  'camera-fill': 'camera',
  'wall-lines': 'wall',
  'shape-outline': 'shape',
  'shape-line': 'shape',
  'shape-fill': 'shape',
  'area-fill': 'area',
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
  const cameras = useSceneStore((state) => state.scene.cameras)
  const people = useSceneStore((state) => state.scene.people)
  const activeAreaId = useSceneStore((state) => state.scene.activeAreaId)
  const addArea = useSceneStore((state) => state.addArea)
  const addWall = useSceneStore((state) => state.addWall)
  const addShape = useSceneStore((state) => state.addShape)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const setSelection = useSceneStore((state) => state.setSelection)
  const clearSelection = useSceneStore((state) => state.clearSelection)
  const deleteEntities = useSceneStore((state) => state.deleteEntities)
  const duplicateEntities = useSceneStore((state) => state.duplicateEntities)
  const updateScene = useSceneStore((state) => state.updateScene)
  const [mapLoaded, setMapLoaded] = React.useState(false)
  const [hoveredFeature, setHoveredFeature] = React.useState<{
    id: string
    type: string
    source: string
    areaId?: string
  } | null>(null)
  const [selectionBounds, setSelectionBounds] = React.useState<Bounds | null>(
    null,
  )
  const [handleFeatures, setHandleFeatures] =
    React.useState<FeatureCollection<Point> | null>(null)
  const [rotationHandle, setRotationHandle] =
    React.useState<FeatureCollection<LineString> | null>(null)
  const [constraintAreaId, setConstraintAreaId] = React.useState<string | null>(
    null,
  )
  const [transformSession, setTransformSession] =
    React.useState<TransformSession | null>(null)
  const hoverTimerRef = React.useRef<number | null>(null)
  const featureStateRef = React.useRef<{
    hover?: {id: string; source: string}
    selected: {id: string; source: string}[]
    constraint?: {id: string; source: string}
  }>({selected: []})
  const lastTransformUpdateRef = React.useRef<number>(0)
  const handleMapLoad = useCallbackRef(() => {
    const map =
      (mapRef.current?.getMap?.() as any) ?? (mapRef.current as unknown as any)
    if (!map) {
      return
    }
    ensureHandleImages(map)
    setMapLoaded(true)
  })

  const activeArea = React.useMemo(() => {
    if (!areas.length) return null
    return areas.find((a) => a.id === activeAreaId) ?? areas[0]
  }, [areas, activeAreaId])

  const getSourceForId = useCallbackRef((id: string) => {
    if (id.startsWith('area-')) return 'areas'
    if (id.startsWith('wall-')) return 'walls'
    if (id.startsWith('shape-')) return 'shapes'
    if (id.startsWith('camera-')) return 'cameras'
    if (id.startsWith('person-')) return 'people'
    return null
  })

  const entityIndex = React.useMemo(() => {
    const index = new Map<string, SceneEntity>()
    areas.forEach((area) => index.set(area.id, area))
    walls.forEach((wall) => index.set(wall.id, wall))
    shapes.forEach((shape) => index.set(shape.id, shape))
    cameras.forEach((camera) => index.set(camera.id, camera))
    people.forEach((person) => index.set(person.id, person))
    return index
  }, [areas, cameras, people, shapes, walls])

  const selectedEntities = React.useMemo(
    () =>
      selectedEntityIds
        .map((id) => entityIndex.get(id))
        .filter(Boolean) as SceneEntity[],
    [entityIndex, selectedEntityIds],
  )

  const isGeometryInsideActiveArea = React.useCallback(
    (points: GeoPoint[]) => {
      if (!activeArea) {
        return false
      }
      return points.every((point) => isPointInsideArea(point, activeArea))
    },
    [activeArea],
  )

  React.useEffect(() => {
    const map =
      (mapRef.current?.getMap?.() as any) ?? (mapRef.current as unknown as any)
    if (!map || !mapLoaded) {
      return
    }

    const nextSelected = selectedEntityIds
      .map((id) => {
        const source = getSourceForId(id)
        return source && map.getSource(source) ? {id, source} : null
      })
      .filter(Boolean) as {id: string; source: string}[]

    featureStateRef.current.selected.forEach((entry) => {
      const stillSelected = nextSelected.some(
        (item) => item.id === entry.id && item.source === entry.source,
      )
      if (!stillSelected && map.getSource(entry.source)) {
        map.setFeatureState(
          {source: entry.source, id: entry.id},
          {selected: false},
        )
      }
    })

    nextSelected.forEach((entry) => {
      map.setFeatureState(
        {source: entry.source, id: entry.id},
        {selected: true},
      )
    })

    featureStateRef.current.selected = nextSelected

    const hoverEntry = hoveredFeature
      ? {id: hoveredFeature.id, source: hoveredFeature.source}
      : null

    if (
      featureStateRef.current.hover &&
      (!hoverEntry ||
        featureStateRef.current.hover.id !== hoverEntry.id ||
        featureStateRef.current.hover.source !== hoverEntry.source)
    ) {
      const {id, source} = featureStateRef.current.hover
      if (map.getSource(source)) {
        map.setFeatureState({source, id}, {hover: false})
      }
    }

    if (hoverEntry && map.getSource(hoverEntry.source)) {
      map.setFeatureState(
        {source: hoverEntry.source, id: hoverEntry.id},
        {hover: true},
      )
    }
    featureStateRef.current.hover = hoverEntry ?? undefined

    const nextConstraint =
      constraintAreaId && map.getSource('areas')
        ? {id: constraintAreaId, source: 'areas'}
        : null

    if (
      featureStateRef.current.constraint &&
      (!nextConstraint ||
        featureStateRef.current.constraint.id !== nextConstraint.id)
    ) {
      const {id, source} = featureStateRef.current.constraint
      map.setFeatureState({source, id}, {constraint: false})
    }

    if (nextConstraint) {
      map.setFeatureState(
        {source: nextConstraint.source, id: nextConstraint.id},
        {constraint: true},
      )
    }

    featureStateRef.current.constraint = nextConstraint ?? undefined
  }, [
    constraintAreaId,
    getSourceForId,
    hoveredFeature,
    mapLoaded,
    selectedEntityIds,
  ])

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
    if (selectedEntities.length === 0) {
      setSelectionBounds(null)
      setHandleFeatures(null)
      setRotationHandle(null)
      return
    }

    const points = selectedEntities.flatMap((entity) => getEntityPoints(entity))
    const bounds = computeBounds(points)
    setSelectionBounds(bounds)

    if (!bounds || !mapRef.current) {
      setHandleFeatures(null)
      setRotationHandle(null)
      return
    }

    const {minLng, maxLng, minLat, maxLat} = bounds
    const topCenter: GeoPoint = [(minLng + maxLng) / 2, maxLat]
    const map = mapRef.current
    const projectedTop = map.project({lng: topCenter[0], lat: topCenter[1]})
    const rotationPixelPoint = {
      x: projectedTop.x,
      y: projectedTop.y - 20,
    }
    const rotationGeo = map.unproject(rotationPixelPoint)
    const handlePoints: {coordinate: GeoPoint; handleType: string}[] = [
      {coordinate: [minLng, maxLat], handleType: 'nw'},
      {coordinate: [maxLng, maxLat], handleType: 'ne'},
      {coordinate: [maxLng, minLat], handleType: 'se'},
      {coordinate: [minLng, minLat], handleType: 'sw'},
      {coordinate: [minLng, (minLat + maxLat) / 2], handleType: 'w'},
      {coordinate: [maxLng, (minLat + maxLat) / 2], handleType: 'e'},
      {coordinate: [(minLng + maxLng) / 2, maxLat], handleType: 'n'},
      {coordinate: [(minLng + maxLng) / 2, minLat], handleType: 's'},
      {
        coordinate: [rotationGeo.lng, rotationGeo.lat],
        handleType: 'rotate',
      },
    ]

    const handles: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: handlePoints.map((handle) => ({
        type: 'Feature',
        id: `handle-${handle.handleType}`,
        properties: {
          handleType: handle.handleType,
          role:
            handle.handleType === 'rotate'
              ? 'rotate'
              : handle.handleType.length === 1
                ? 'edge'
                : 'corner',
        },
        geometry: {type: 'Point', coordinates: handle.coordinate},
      })),
    }

    const rotationFeatures: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'rotation-connector',
          properties: {handleType: 'rotate'},
          geometry: {
            type: 'LineString',
            coordinates: [
              topCenter,
              [rotationGeo.lng, rotationGeo.lat],
            ] as GeoPoint[],
          },
        },
      ],
    }

    setHandleFeatures(handles)
    setRotationHandle(rotationFeatures)
  }, [selectedEntities])

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

  const scheduleHoverTooltip = useCallbackRef(
    (text: string, event: MapLayerMouseEvent) => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current)
      }
      hoverTimerRef.current = window.setTimeout(() => {
        setTooltip({
          text,
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
      }, 500)
    },
  )

  const clearHoverTooltip = useCallbackRef(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setTooltip(null)
  })

  const hitTestHandles = useCallbackRef(
    (point: {x: number; y: number}, featuresFromEvent?: any[]) => {
      const map =
        (mapRef.current?.getMap?.() as any) ??
        (mapRef.current as unknown as any)
      if (!map) {
        return null
      }
      const features =
        featuresFromEvent ??
        map.queryRenderedFeatures([point.x, point.y], {
          layers: HANDLE_LAYER_IDS,
        })
      if (!features || features.length === 0) {
        return null
      }
      const top =
        features.find((feature) =>
          HANDLE_LAYER_IDS.includes(feature.layer?.id as string),
        ) ?? features[0]
      const handleType = top.properties?.handleType
      if (!handleType) {
        return null
      }
      return {
        handleType: String(handleType),
        role: String(top.properties?.role ?? ''),
      }
    },
  )

  const hitTestEntities = useCallbackRef(
    (
      point: {x: number; y: number},
      featuresFromEvent?: any[],
      geoPoint?: GeoPoint,
    ) => {
      const map =
        (mapRef.current?.getMap?.() as any) ??
        (mapRef.current as unknown as any)
      if (!map) {
        return null
      }
      const features =
        featuresFromEvent ??
        map.queryRenderedFeatures([point.x, point.y], {
          layers: ENTITY_LAYER_IDS,
        })
      if (!features || features.length === 0) {
        if (geoPoint) {
          const turfPt = turfPoint(geoPoint)
          const areaMatch = areas.find((area) => {
            const ring = closeRing(area.geometry.coordinates)
            try {
              return booleanPointInPolygon(turfPt, turfPolygon([ring]))
            } catch {
              return false
            }
          })
          if (areaMatch) {
            return {
              id: areaMatch.id,
              type: 'area',
              source: 'areas',
              areaId: areaMatch.id,
              layerId: 'area-fill',
            }
          }

          const shapeMatch = shapes.find((shape) => {
            if (shape.shapeType === 'line' || shape.geometry.length < 3) {
              return false
            }
            const ring = closeRing(shape.geometry)
            try {
              return booleanPointInPolygon(turfPt, turfPolygon([ring]))
            } catch {
              return false
            }
          })
          if (shapeMatch) {
            return {
              id: shapeMatch.id,
              type: 'shape',
              source: 'shapes',
              areaId: shapeMatch.areaId,
              layerId: 'shape-fill',
            }
          }

          const personMatch = people.find((person) => {
            const dist = Math.hypot(
              person.x - geoPoint[0],
              person.y - geoPoint[1],
            )
            return dist < person.radius * 1.5
          })
          if (personMatch) {
            return {
              id: personMatch.id,
              type: 'person',
              source: 'people',
              areaId: personMatch.areaId,
              layerId: 'people-fill',
            }
          }

          const cameraMatch = cameras.find((camera) => {
            const dist = Math.hypot(
              camera.x - geoPoint[0],
              camera.y - geoPoint[1],
            )
            return dist < 0.0002
          })
          if (cameraMatch) {
            return {
              id: cameraMatch.id,
              type: 'camera',
              source: 'cameras',
              areaId: cameraMatch.areaId,
              layerId: 'camera-fill',
            }
          }

          const wallMatch = walls.find((wall) => {
            if (wall.points.length < 2) {
              return false
            }
            return wall.points.some((pt, index) => {
              if (index === wall.points.length - 1) return false
              const next = wall.points[index + 1]
              return distanceToSegment(geoPoint, pt, next) < 0.0001
            })
          })
          if (wallMatch) {
            return {
              id: wallMatch.id,
              type: 'wall',
              source: 'walls',
              areaId: wallMatch.areaId,
              layerId: 'wall-lines',
            }
          }
        }
        return null
      }

      const resolveType = (feature: any) => {
        const rawType =
          feature.properties?.entityType ??
          feature.properties?.type ??
          LAYER_TYPE_MAP[feature.layer?.id as string]
        if (rawType === 'area' || String(rawType ?? '').includes('area')) {
          return 'area'
        }
        return (
          HIT_TEST_PRIORITY.find((type) => String(rawType ?? '').includes(type)) ??
          null
        )
      }

      const prioritized = HIT_TEST_PRIORITY.find((priority) =>
        features.some((feature) => resolveType(feature) === priority),
      )

      const matched =
        prioritized != null
          ? features.find((feature) => resolveType(feature) === prioritized)
          : features[0]

      if (!matched) {
        return null
      }

      return {
        id: String(matched.id ?? matched.properties?.id),
        type: (resolveType(matched) ?? 'area') as string,
        source: matched.source as string,
        areaId: matched.properties?.areaId as string | undefined,
        layerId: matched.layer?.id as string | undefined,
      }
    },
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

  const getHandleCursor = (handleType: string) => {
    if (handleType === 'nw' || handleType === 'se') return 'nwse-resize'
    if (handleType === 'ne' || handleType === 'sw') return 'nesw-resize'
    if (handleType === 'n' || handleType === 's') return 'ns-resize'
    if (handleType === 'e' || handleType === 'w') return 'ew-resize'
    if (handleType === 'rotate') return ROTATE_CURSOR
    return 'pointer'
  }

  const startTransformSession = useCallbackRef(
    (
      type: TransformSession['type'],
      start: GeoPoint,
      handleType: string | undefined,
      entities: SceneEntity[],
    ) => {
      if (entities.length === 0) {
        return
      }

      const originalGeometries: Record<string, GeoPoint[]> = {}
      entities.forEach((entity) => {
        originalGeometries[entity.id] = getEntityPoints(entity)
      })

      if (type === 'move') {
        entities
          .filter((entity) => entity.type === 'area')
          .forEach((area) => {
            const areaId = area.id
            const collect = (
              list:
                | typeof walls
                | typeof shapes
                | typeof cameras
                | typeof people,
            ) => {
              list
                .filter((item) => (item as any).areaId === areaId)
                .forEach((item) => {
                  if (originalGeometries[item.id]) {
                    return
                  }
                  originalGeometries[item.id] = getEntityPoints(
                    item as SceneEntity,
                  )
                })
            }
            collect(walls)
            collect(shapes)
            collect(cameras)
            collect(people)
          })
      }
      const bounds = computeBounds(
        entities.flatMap((entity) => getEntityPoints(entity)),
      )
      setTransformSession({
        type,
        handleType,
        startPoint: start,
        origin: bounds ? getBoundsCenter(bounds) : start,
        originalGeometries,
        originalBounds: bounds,
      })
      lastTransformUpdateRef.current = Date.now()
    },
  )

  const applyPointsToScene = (
    scene: SceneRoot,
    id: string,
    points: GeoPoint[],
  ) => {
    const area = scene.areas.find((item) => item.id === id)
    if (area) {
      area.geometry.coordinates = closeRing(points)
      return
    }
    const wall = scene.walls.find((item) => item.id === id)
    if (wall) {
      wall.points = points
      return
    }
    const shape = scene.shapes.find((item) => item.id === id)
    if (shape) {
      shape.geometry = points
      return
    }
    const camera = scene.cameras.find((item) => item.id === id)
    if (camera) {
      camera.x = points[0]?.[0] ?? camera.x
      camera.y = points[0]?.[1] ?? camera.y
      return
    }
    const person = scene.people.find((item) => item.id === id)
    if (person) {
      person.x = points[0]?.[0] ?? person.x
      person.y = points[0]?.[1] ?? person.y
    }
  }

  const getAreaForEntity = (id: string) => {
    const entity = entityIndex.get(id)
    if (!entity || entity.type === 'area') {
      return undefined
    }
    const areaId = (entity as any).areaId as string | undefined
    if (!areaId) {
      return undefined
    }
    return areas.find((area) => area.id === areaId)
  }

  const distanceToSegment = (point: GeoPoint, a: GeoPoint, b: GeoPoint) => {
    const [px, py] = point
    const [ax, ay] = a
    const [bx, by] = b
    const dx = bx - ax
    const dy = by - ay
    const lengthSq = dx * dx + dy * dy
    if (lengthSq === 0) {
      return Math.hypot(px - ax, py - ay)
    }
    let t = ((px - ax) * dx + (py - ay) * dy) / lengthSq
    t = Math.max(0, Math.min(1, t))
    const projX = ax + t * dx
    const projY = ay + t * dy
    return Math.hypot(px - projX, py - projY)
  }

  const isPersonPositionBlocked = (
    candidate: GeoPoint,
    personId: string,
    radius: number,
    areaId?: string,
  ) => {
    const collidesPerson = people.some((person) => {
      if (person.id === personId) return false
      if (areaId && person.areaId !== areaId) return false
      const distance = Math.hypot(
        person.x - candidate[0],
        person.y - candidate[1],
      )
      return distance < radius + person.radius
    })

    if (collidesPerson) {
      return true
    }

    const relevantWalls = areaId
      ? walls.filter((wall) => wall.areaId === areaId)
      : walls
    const hitsWall = relevantWalls.some((wall) => {
      if (wall.points.length < 2) {
        return false
      }
      const threshold = radius + wall.thickness
      return wall.points.some((point, index) => {
        if (index === wall.points.length - 1) {
          return false
        }
        const next = wall.points[index + 1]
        return distanceToSegment(candidate, point, next) < threshold
      })
    })

    if (hitsWall) {
      return true
    }

    const relevantShapes = areaId
      ? shapes.filter((shape) => shape.areaId === areaId)
      : shapes
    const hitsShape = relevantShapes.some((shape) => {
      if (shape.shapeType === 'line') {
        return false
      }
      if (shape.geometry.length < 3) {
        return false
      }
      const ring = closeRing(shape.geometry)
      try {
        return booleanPointInPolygon(turfPoint(candidate), turfPolygon([ring]))
      } catch (error) {
        console.warn('Skipping invalid shape during collision test', error)
        return false
      }
    })

    return hitsShape
  }

  const processTransformMove = useCallbackRef(
    (
      event: MapLayerMouseEvent,
      mapPoint: GeoPoint,
      modifiers?: {shiftKey?: boolean},
    ) => {
    if (!transformSession) {
      return
    }
    lastTransformUpdateRef.current = Date.now()

    if (transformSession.type === 'move') {
      const updates: Record<string, GeoPoint[]> = {}
      let blockedArea: string | null = null
      const deltaLng = mapPoint[0] - transformSession.startPoint[0]
      const deltaLat = mapPoint[1] - transformSession.startPoint[1]
      const movingAreaIds = new Set(
        selectedEntities
          .filter((entity) => entity.type === 'area')
          .map((entity) => entity.id),
      )
      Object.entries(transformSession.originalGeometries).forEach(
        ([id, original]) => {
          const entity = entityIndex.get(id)
          const nextPoints = translatePoints(
            original,
            deltaLng,
            deltaLat,
          )
          const areaForEntity = getAreaForEntity(id)
          const areaIsMoving =
            areaForEntity && movingAreaIds.has(areaForEntity.id)
          if (
            entity?.type === 'person' &&
            isPersonPositionBlocked(
              nextPoints[0] as GeoPoint,
              entity.id,
              (entity as PersonEntity).radius,
              areaForEntity?.id,
            )
          ) {
            blockedArea = areaForEntity?.id ?? null
            return
          }
          if (!areaIsMoving) {
            const insideArea = isGeometryInsideAreaSelection(
              nextPoints,
              areaForEntity,
            )
            if (!insideArea) {
              blockedArea = areaForEntity?.id ?? null
              return
            }
          }
          updates[id] = nextPoints
        },
      )

      // Move objects inside selected areas to preserve relative positions
      selectedEntities
        .filter((entity) => entity.type === 'area')
        .forEach((area) => {
          const areaId = area.id
          const moveAssociated = (ids: string[]) => {
            ids.forEach((entityId) => {
              if (updates[entityId]) {
                return
              }
              const base = transformSession.originalGeometries[entityId]
              if (!base) {
                return
              }
              updates[entityId] = translatePoints(base, deltaLng, deltaLat)
            })
          }

          const associatedIds = [
            ...walls.filter((wall) => wall.areaId === areaId).map((w) => w.id),
            ...shapes
              .filter((shape) => shape.areaId === areaId)
              .map((shape) => shape.id),
            ...cameras
              .filter((camera) => camera.areaId === areaId)
              .map((camera) => camera.id),
            ...people
              .filter((person) => person.areaId === areaId)
              .map((person) => person.id),
          ]

          moveAssociated(associatedIds)
        })

      if (blockedArea) {
        setConstraintAreaId(blockedArea)
        setCursorOverride('not-allowed')
        return
      }

        setConstraintAreaId(null)
        setCursorOverride('move')

        if (Object.keys(updates).length > 0) {
          updateScene((scene) => {
            Object.entries(updates).forEach(([id, points]) => {
              applyPointsToScene(scene, id, points as GeoPoint[])
            })
            scene.meta.updatedAt = new Date().toISOString()
          })
        }
      }

      if (transformSession.type === 'resize' && transformSession.handleType) {
        const bounds =
          transformSession.originalBounds ??
          computeBounds(
            Object.values(transformSession.originalGeometries).flatMap(
              (points) => points,
            ),
          )
        if (!bounds) {
          return
        }
        const centerX = (bounds.minLng + bounds.maxLng) / 2
        const centerY = (bounds.minLat + bounds.maxLat) / 2
        const initialHandle: Record<string, GeoPoint> = {
          e: [bounds.maxLng, centerY],
          w: [bounds.minLng, centerY],
          n: [centerX, bounds.maxLat],
          s: [centerX, bounds.minLat],
          ne: [bounds.maxLng, bounds.maxLat],
          nw: [bounds.minLng, bounds.maxLat],
          se: [bounds.maxLng, bounds.minLat],
          sw: [bounds.minLng, bounds.minLat],
        }
        const anchors: Record<string, GeoPoint> = {
          e: [bounds.minLng, centerY],
          w: [bounds.maxLng, centerY],
          n: [centerX, bounds.minLat],
          s: [centerX, bounds.maxLat],
          ne: [bounds.minLng, bounds.minLat],
          nw: [bounds.maxLng, bounds.minLat],
          se: [bounds.minLng, bounds.maxLat],
          sw: [bounds.maxLng, bounds.maxLat],
        }
        const handleType = transformSession.handleType
        const anchor = anchors[handleType] ?? [centerX, centerY]
        const startHandle =
          initialHandle[handleType] ?? transformSession.startPoint

        const originVector = {
          dx: startHandle[0] - anchor[0],
          dy: startHandle[1] - anchor[1],
        }
        const nextVector = {
          dx: mapPoint[0] - anchor[0],
          dy: mapPoint[1] - anchor[1],
        }

        let scaleX = originVector.dx !== 0 ? nextVector.dx / originVector.dx : 1
        let scaleY = originVector.dy !== 0 ? nextVector.dy / originVector.dy : 1

        if (handleType === 'e' || handleType === 'w') {
          scaleY = 1
        }
        if (handleType === 'n' || handleType === 's') {
          scaleX = 1
        }

        if (modifiers?.shiftKey) {
          const uniform = Math.min(Math.abs(scaleX || 1), Math.abs(scaleY || 1))
          const signX = Math.sign(scaleX || 1)
          const signY = Math.sign(scaleY || 1)
          scaleX = uniform * signX
          scaleY = uniform * signY
        }

        const updates: Record<string, GeoPoint[]> = {}
        let blockedArea: string | null = null

        Object.entries(transformSession.originalGeometries).forEach(
          ([id, original]) => {
            const entity = entityIndex.get(id)
            const scaled = scalePoints(original, anchor, scaleX, scaleY)
            const areaForEntity = getAreaForEntity(id)
            if (
              entity?.type === 'person' &&
              isPersonPositionBlocked(
                scaled[0] as GeoPoint,
                entity.id,
                (entity as PersonEntity).radius,
                areaForEntity?.id,
              )
            ) {
              blockedArea = areaForEntity?.id ?? null
              return
            }
            if (!isGeometryInsideAreaSelection(scaled, areaForEntity)) {
              blockedArea = areaForEntity?.id ?? null
              return
            }
            updates[id] = scaled
          },
        )

        if (blockedArea) {
          setConstraintAreaId(blockedArea)
          setCursorOverride('not-allowed')
          return
        }

        setConstraintAreaId(null)
        setCursorOverride(getHandleCursor(handleType))

        if (Object.keys(updates).length > 0) {
          updateScene((scene) => {
            Object.entries(updates).forEach(([id, points]) => {
              applyPointsToScene(scene, id, points as GeoPoint[])
            })
            scene.meta.updatedAt = new Date().toISOString()
          })
        }
      }

      if (transformSession.type === 'rotate') {
        const origin = transformSession.origin ?? mapPoint
        const startAngle = Math.atan2(
          transformSession.startPoint[1] - origin[1],
          transformSession.startPoint[0] - origin[0],
        )
        const currentAngle = Math.atan2(
          mapPoint[1] - origin[1],
          mapPoint[0] - origin[0],
        )
        let deltaDeg = ((currentAngle - startAngle) * 180) / Math.PI
        if (!modifiers?.shiftKey) {
          deltaDeg = Math.round(deltaDeg / 15) * 15
        }

        const updates: Record<string, GeoPoint[]> = {}
        let blockedArea: string | null = null

        Object.entries(transformSession.originalGeometries).forEach(
          ([id, original]) => {
            const entity = entityIndex.get(id)
            const rotated = rotatePoints(original, origin, deltaDeg)
            const areaForEntity = getAreaForEntity(id)
            if (
              entity?.type === 'person' &&
              isPersonPositionBlocked(
                rotated[0] as GeoPoint,
                entity.id,
                (entity as PersonEntity).radius,
                areaForEntity?.id,
              )
            ) {
              blockedArea = areaForEntity?.id ?? null
              return
            }
            if (!isGeometryInsideAreaSelection(rotated, areaForEntity)) {
              blockedArea = areaForEntity?.id ?? null
              return
            }
            updates[id] = rotated
          },
        )

        if (blockedArea) {
          setConstraintAreaId(blockedArea)
          setCursorOverride('not-allowed')
          return
        }

        setConstraintAreaId(null)
        setCursorOverride(ROTATE_CURSOR)
        setTooltip({
          text: `Rotation: ${deltaDeg.toFixed(0)}°`,
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })

        if (Object.keys(updates).length > 0) {
          updateScene((scene) => {
            Object.entries(updates).forEach(([id, points]) => {
              applyPointsToScene(scene, id, points as GeoPoint[])
            })
            scene.meta.updatedAt = new Date().toISOString()
          })
        }
      }
    },
  )

  const handleMouseDown = (event: MapLayerMouseEvent) => {
    if (!isEditMode || activeTool !== 'select') {
      return
    }
    const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
    const shiftKey = Boolean(
      (event.originalEvent as MouseEvent | undefined)?.shiftKey,
    )

    const handleHit = hitTestHandles(event.point, event.features)
    if (handleHit && selectedEntities.length > 0) {
      startTransformSession(
        handleHit.handleType === 'rotate' ? 'rotate' : 'resize',
        mapPoint,
        handleHit.handleType,
        selectedEntities,
      )
      return
    }

    const isPointInsideEntity = (point: GeoPoint, entity: SceneEntity) => {
      if (entity.type === 'area' || entity.type === 'shape') {
        if (entity.geometry.length < 3 && entity.type === 'shape') {
          return false
        }
        const ring = closeRing(getEntityPoints(entity))
        try {
          return booleanPointInPolygon(turfPoint(point), turfPolygon([ring]))
        } catch {
          return false
        }
      }
      if (entity.type === 'wall') {
        const pts = entity.points
        return pts.some((pt, index) => {
          if (index === pts.length - 1) return false
          return distanceToSegment(point, pt, pts[index + 1]) < 0.0001
        })
      }
      if (entity.type === 'person') {
        return Math.hypot(entity.x - point[0], entity.y - point[1]) <
          entity.radius * 1.5
      }
      if (entity.type === 'camera') {
        return Math.hypot(entity.x - point[0], entity.y - point[1]) < 0.0002
      }
      return false
    }

    const clickedOnSelection =
      selectedEntities.length > 0 &&
      (selectedEntities.some((entity) => isPointInsideEntity(mapPoint, entity)) ||
        (selectionBounds
          ? booleanPointInPolygon(
              turfPoint(mapPoint),
              turfPolygon([boundsToPolygon(selectionBounds)]),
            )
          : false))

    if (clickedOnSelection) {
      startTransformSession('move', mapPoint, undefined, selectedEntities)
      return
    }

    const hit = hitTestEntities(event.point, event.features, mapPoint)
    if (hit) {
      const alreadySelected = selectedEntityIds.includes(hit.id)
      const nextSelection = shiftKey
        ? alreadySelected
          ? selectedEntityIds.filter((id) => id !== hit.id)
          : [...selectedEntityIds, hit.id]
        : [hit.id]
      setSelection(nextSelection)

      const entitiesForSession = nextSelection
        .map((id) => entityIndex.get(id))
        .filter(Boolean) as SceneEntity[]

      startTransformSession('move', mapPoint, undefined, entitiesForSession)
      return
    }

    clearSelection()
  }

  const handleMouseUp = () => {
    if (transformSession) {
      if (transformSession.type === 'rotate') {
        setTooltip(null)
      }
      setTransformSession(null)
      setConstraintAreaId(null)
    }
    if (isDragging) {
      setIsDragging(false)
    }
  }

  const handleDeleteSelection = () => {
    if (!selectedEntityIds.length) {
      return
    }
    deleteEntities(selectedEntityIds)
    clearSelection()
  }

  const handleDuplicateSelection = () => {
    if (!selectedEntityIds.length) {
      return
    }
    duplicateEntities(selectedEntityIds)
  }

  const handlePointerMove = (event: MapLayerMouseEvent) => {
    setCursorPoint({x: event.point.x, y: event.point.y})
    const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
    const hasActiveArea = Boolean(activeArea)
    const insideActiveArea =
      activeTool === 'draw-area' ||
      (hasActiveArea && activeArea
        ? isPointInsideArea(mapPoint, activeArea)
        : false)

    if (!isEditMode) {
      setTooltip(null)
      setHoveredFeature(null)
      return
    }

    if (transformSession) {
      processTransformMove(event, mapPoint, {
        shiftKey: Boolean(
          (event.originalEvent as MouseEvent | undefined)?.shiftKey,
        ),
      })
      return
    }

    if (activeTool === 'select') {
      const handleHit = hitTestHandles(event.point, event.features)
      if (handleHit) {
        setCursorOverride(getHandleCursor(handleHit.handleType))
        clearHoverTooltip()
        return
      }

      const hit = hitTestEntities(event.point, event.features, mapPoint)
      if (hit) {
        setHoveredFeature(hit)
        setCursorOverride('pointer')
        scheduleHoverTooltip(`${hit.type} • ${hit.id}`, event)
      } else {
        setHoveredFeature(null)
        clearHoverTooltip()
        setCursorOverride(undefined)
      }
      return
    }

    setHoveredFeature(null)
    clearHoverTooltip()
    setCursorOverride(undefined)

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

      if (activeTool === 'select') {
        const feature = hitTestEntities(event.point, event.features, [
          event.lngLat.lng,
          event.lngLat.lat,
        ])
        const shiftKey = Boolean(
          (event.originalEvent as MouseEvent | undefined)?.shiftKey,
        )
        if (feature) {
          const alreadySelected = selectedEntityIds.includes(feature.id)
          const nextSelection = shiftKey
            ? alreadySelected
              ? selectedEntityIds.filter((id) => id !== feature.id)
              : [...selectedEntityIds, feature.id]
            : [feature.id]
          setSelection(nextSelection)
        } else {
          clearSelection()
        }
        return
      }

      if (activeTool === 'hand') {
        clearSelection()
        return
      }

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
      clearSelection,
      handleAreaClick,
      handleShapeClick,
      handleWallClick,
      isEditMode,
      selectedEntityIds,
      setSelection,
      hitTestEntities,
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

  const cameraFeatures = React.useMemo(
    () => buildCameraFeatures(cameras),
    [cameras],
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

  const selectionBoundsFeature: FeatureCollection | null = React.useMemo(() => {
    if (!selectionBounds) {
      return null
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'selection-bounds',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [boundsToPolygon(selectionBounds)],
          },
        },
      ],
    }
  }, [selectionBounds])

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
      <Mapbox
        dragPan={activeTool === 'hand'}
        interactiveLayerIds={[...ENTITY_LAYER_IDS, ...HANDLE_LAYER_IDS]}
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
        onLoad={handleMapLoad}
        onMouseDown={handleMouseDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handleMouseUp}
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

        <MapViewCameraLayers cameraFeatures={cameraFeatures} />
        <MapViewPeopleLayers personFeatures={personFeatures} />

        {selectionBoundsFeature ? (
          <Source
            data={selectionBoundsFeature}
            id='selection-bounds'
            type='geojson'
          >
            <Layer
              id='selection-bounds-outline'
              type='line'
              paint={{
                'line-color': '#2563EB',
                'line-width': 1.5,
                'line-dasharray': [2, 2],
                'line-opacity': 0.8,
              }}
            />
          </Source>
        ) : null}

        {rotationHandle ? (
          <Source
            data={rotationHandle}
            id='rotation-handle-line'
            type='geojson'
          >
            <Layer
              id='rotation-connector'
              type='line'
              paint={{
                'line-color': '#2563EB',
                'line-width': 1,
                'line-dasharray': [1, 1],
              }}
            />
          </Source>
        ) : null}

        {handleFeatures && mapLoaded ? (
          <Source data={handleFeatures} id='selection-handles' type='geojson'>
            <Layer
              filter={['==', ['get', 'role'], 'corner']}
              id='selection-handles-corner'
              type='symbol'
              layout={{
                'icon-image': 'handle-square',
                'icon-size': 1,
                'icon-allow-overlap': true,
              }}
            />
            <Layer
              filter={['==', ['get', 'role'], 'edge']}
              id='selection-handles-edge'
              type='circle'
              paint={{
                'circle-radius': 6,
                'circle-color': '#FFFFFF',
                'circle-stroke-color': '#2563EB',
                'circle-stroke-width': 2,
              }}
            />
            <Layer
              filter={['==', ['get', 'handleType'], 'rotate']}
              id='selection-rotation-handle'
              type='circle'
              paint={{
                'circle-radius': 5,
                'circle-color': '#FFFFFF',
                'circle-stroke-color': '#2563EB',
                'circle-stroke-width': 2,
              }}
            />
          </Source>
        ) : null}
      </Mapbox>

      {isEditMode && selectedEntityIds.length > 0 ? (
        <div className='pointer-events-none absolute left-4 top-20 z-30 flex flex-col gap-2'>
          <div className='pointer-events-auto flex items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow'>
            <Badge variant='secondary'>
              {`${selectedEntityIds.length} object${selectedEntityIds.length === 1 ? '' : 's'} selected`}
            </Badge>
            <div className='flex items-center gap-1'>
              <Button size='sm' variant='ghost' onClick={handleDeleteSelection}>
                Delete
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleDuplicateSelection}
              >
                Duplicate
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => toast.info('Grouping coming soon')}
              >
                Group
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tooltip ? <MapViewTooltip tooltip={tooltip} /> : null}

      {activeTool === 'draw-area' && isEditMode && cursorPoint ? (
        <MapViewCursorOverlay color={drawingColor} cursorPoint={cursorPoint} />
      ) : null}
    </div>
  )
}
