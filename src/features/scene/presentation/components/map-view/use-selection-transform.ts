import type {FeatureCollection, LineString, Point} from 'geojson'
import type {MapboxGeoJSONFeature, Map as MapboxMap} from 'mapbox-gl'
import type {MapMouseEvent, MapRef} from 'react-map-gl/mapbox'

import {booleanPointInPolygon, polygon, point as turfPoint} from '@turf/turf'
import React from 'react'

import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  PersonEntity,
  SceneEntity,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'
import type {TooltipState} from '@/features/scene/presentation/components/map-view/map-view-types'
import type {
  Bounds,
} from '@/features/scene/presentation/components/map-view/selection-geometry'

import {closeRing} from '@/features/scene/presentation/components/map-view/map-view-helpers'
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

type MapLayerMouseEvent = MapMouseEvent

export const HANDLE_LAYER_IDS = [
  'selection-rotation-handle',
  'selection-handles-corner',
  'selection-handles-edge',
]

export const ENTITY_LAYER_IDS = [
  'people-fill',
  'camera-icon',
  'camera-outline',
  'camera-fov-fill',
  'camera-fov-outline',
  'camera-direction',
  'wall-hit-area',
  'wall-lines',
  'shape-outline',
  'shape-line',
  'shape-fill',
  'area-fill',
]

const LAYER_TYPE_MAP: Record<string, string> = {
  'people-fill': 'person',
  'camera-icon': 'camera',
  'camera-outline': 'camera',
  'camera-fov-fill': 'camera',
  'camera-fov-outline': 'camera',
  'camera-direction': 'camera',
  'wall-hit-area': 'wall',
  'wall-lines': 'wall',
  'shape-outline': 'shape',
  'shape-line': 'shape',
  'shape-fill': 'shape',
  'area-fill': 'area',
}

const ensureHandleImages = (map: MapboxMap) => {
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

const ROTATE_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%232563EB' d='M12 2v3l4-4-4-4v3C6.486 0 2 4.486 2 10s4.486 10 10 10 10-4.486 10-10h-2c0 4.411-3.589 8-8 8S4 14.411 4 10 7.589 2 12 2z'/%3E%3C/svg%3E\") 12 12, auto"

interface TransformSession {
  type: 'move' | 'resize' | 'rotate'
  handleType?: string
  startPoint: GeoPoint
  origin?: GeoPoint
  originalGeometries: Record<string, GeoPoint[]>
  originalBounds?: Bounds | null
}

interface UseSelectionTransformParams {
  mapRef: React.RefObject<MapRef | null>
  activeTool: EditorTool
  isEditMode: boolean
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameras: CameraEntity[]
  people: PersonEntity[]
  selectedEntityIds: string[]
  setSelection: (ids: string[]) => void
  clearSelection: () => void
  updateScene: (updater: (scene: SceneRoot) => void) => void
  deleteEntities: (ids: string[]) => void
  duplicateEntities: (ids: string[]) => void
  setTooltip: (tooltip: TooltipState | null) => void
  setCursorOverride: (cursor?: string) => void
  baseCursor: string | undefined
}

interface UseSelectionTransformResult {
  selectionBoundsFeature: FeatureCollection | null
  handleFeatures: FeatureCollection<Point> | null
  rotationHandle: FeatureCollection<LineString> | null
  constraintAreaId: string | null
  hoveredFeature: {
    id: string
    type: string
    source: string
    areaId?: string
  } | null
  cursor: string | undefined
  selectionCount: number
  onPointerMove: (event: MapLayerMouseEvent) => boolean
  onMouseDown: (event: MapLayerMouseEvent) => boolean
  onMapClick: (event: MapLayerMouseEvent) => boolean
  onMouseUp: () => void
  onMapLoad: () => void
  onDeleteSelection: () => void
  onDuplicateSelection: () => void
  mapLoaded: boolean
}

const getHandleCursor = (handleType: string) => {
  if (handleType === 'nw' || handleType === 'se') return 'nwse-resize'
  if (handleType === 'ne' || handleType === 'sw') return 'nesw-resize'
  if (handleType === 'n' || handleType === 's') return 'ns-resize'
  if (handleType === 'e' || handleType === 'w') return 'ew-resize'
  if (handleType === 'rotate') return ROTATE_CURSOR
  return 'pointer'
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

const isPointInsideEntity = (point: GeoPoint, entity: SceneEntity) => {
  if (entity.type === 'area' || entity.type === 'shape') {
    if (entity.type === 'shape' && entity.geometry.length < 3) {
      return false
    }
    const ringCoords = closeRing(getEntityPoints(entity))
    if (ringCoords.length < 4) {
      return false
    }
    const ring = polygon([ringCoords])
    try {
      return booleanPointInPolygon(turfPoint(point), ring)
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
    return Math.hypot(entity.x - point[0], entity.y - point[1]) < entity.radius * 1.5
  }
  if (entity.type === 'camera') {
    return Math.hypot(entity.x - point[0], entity.y - point[1]) < 0.0002
  }
  return false
}

interface TransformComputationResult {
  updates: Record<string, GeoPoint[]>
  constraintAreaId: string | null
  cursor?: string
  tooltipText?: string
}

interface MoveTransformParams {
  transformSession: TransformSession
  mapPoint: GeoPoint
  selectedEntities: SceneEntity[]
  entityIndex: Map<string, SceneEntity>
  getAreaForEntity: (id: string) => AreaEntity | undefined
  getEntityAreaId: (entity: SceneEntity) => string | undefined
  isGeometryInsideAreaSelection: typeof isGeometryInsideAreaSelection
  translatePoints: typeof translatePoints
  isPersonPositionBlocked: (
    candidate: GeoPoint,
    personId: string,
    radius: number,
    areaId?: string,
  ) => boolean
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameras: CameraEntity[]
  people: PersonEntity[]
}

interface ResizeTransformParams {
  transformSession: TransformSession & {handleType: string}
  mapPoint: GeoPoint
  entityIndex: Map<string, SceneEntity>
  getAreaForEntity: (id: string) => AreaEntity | undefined
  getEntityAreaId: (entity: SceneEntity) => string | undefined
  isGeometryInsideAreaSelection: typeof isGeometryInsideAreaSelection
  isPersonPositionBlocked: (
    candidate: GeoPoint,
    personId: string,
    radius: number,
    areaId?: string,
  ) => boolean
  scalePoints: typeof scalePoints
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameras: CameraEntity[]
  people: PersonEntity[]
  originalBounds: Bounds | null
  modifiers?: {shiftKey?: boolean}
}

interface RotateTransformParams {
  transformSession: TransformSession
  mapPoint: GeoPoint
  entityIndex: Map<string, SceneEntity>
  getAreaForEntity: (id: string) => AreaEntity | undefined
  isGeometryInsideAreaSelection: typeof isGeometryInsideAreaSelection
  isPersonPositionBlocked: (
    candidate: GeoPoint,
    personId: string,
    radius: number,
    areaId?: string,
  ) => boolean
  origin: GeoPoint
  rotatePoints: typeof rotatePoints
}

interface HandleFeaturesResult {
  handleFeatures: FeatureCollection<Point> | null
  rotationHandle: FeatureCollection<LineString> | null
}

const createHandleFeatures = (
  bounds: Bounds | null,
  map: MapboxMap | null,
): HandleFeaturesResult => {
  if (!bounds || !map) {
    return {handleFeatures: null, rotationHandle: null}
  }

  const {minLng, maxLng, minLat, maxLat} = bounds
  const topCenter: GeoPoint = [(minLng + maxLng) / 2, maxLat]
  const projectedTop = map.project({lng: topCenter[0], lat: topCenter[1]})
  const rotationPixelPoint = {
    x: projectedTop.x,
    y: projectedTop.y - 20,
  }
  const rotationGeo = map.unproject([rotationPixelPoint.x, rotationPixelPoint.y])
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

  const handleFeatures: FeatureCollection<Point> = {
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

  const rotationHandle: FeatureCollection<LineString> = {
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

  return {handleFeatures, rotationHandle}
}

const syncFeatureStates = ({
  map,
  mapLoaded,
  selectedEntityIds,
  hoveredFeature,
  constraintAreaId,
  getSourcesForId,
  featureStateRef,
}: {
  map: MapboxMap | null
  mapLoaded: boolean
  selectedEntityIds: string[]
  hoveredFeature: {id: string; source: string} | null
  constraintAreaId: string | null
  getSourcesForId: (id: string) => string[]
  featureStateRef: React.MutableRefObject<{
    hover?: {id: string; source: string}
    selected: {id: string; source: string}[]
    constraint?: {id: string; source: string}
  }>
}) => {
  if (!map || !mapLoaded) {
    return
  }

  const nextSelected = selectedEntityIds
    .flatMap((id) =>
      getSourcesForId(id)
        .map((source) => (map.getSource(source) ? {id, source} : null))
        .filter(Boolean) as {id: string; source: string}[],
    )

  featureStateRef.current.selected.forEach((entry) => {
    const stillSelected = nextSelected.some(
      (item) => item.id === entry.id && item.source === entry.source,
    )
    if (!stillSelected && map.getSource(entry.source)) {
      map.setFeatureState({source: entry.source, id: entry.id}, {selected: false})
    }
  })

  nextSelected.forEach((entry) => {
    map.setFeatureState({source: entry.source, id: entry.id}, {selected: true})
  })

  featureStateRef.current.selected = nextSelected

  const hoverEntry = hoveredFeature ? {id: hoveredFeature.id, source: hoveredFeature.source} : null

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
    map.setFeatureState({source: hoverEntry.source, id: hoverEntry.id}, {hover: true})
  }
  featureStateRef.current.hover = hoverEntry ?? undefined

  const nextConstraint =
    constraintAreaId && map.getSource('areas')
      ? {id: constraintAreaId, source: 'areas'}
      : null

  if (
    featureStateRef.current.constraint &&
    (!nextConstraint || featureStateRef.current.constraint.id !== nextConstraint.id)
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
}

interface PersonBlockParams {
  candidate: GeoPoint
  personId: string
  radius: number
  areaId?: string
  people: PersonEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  getEntityAreaId: (entity: SceneEntity) => string | undefined
}

const isPersonPositionBlockedHelper = ({
  candidate,
  personId,
  radius,
  areaId,
  people,
  walls,
  shapes,
  getEntityAreaId,
}: PersonBlockParams) => {
  const collidesPerson = people.some((person) => {
    if (person.id === personId) return false
    if (areaId && getEntityAreaId(person as SceneEntity) !== areaId) {
      return false
    }
    const distance = Math.hypot((person as PersonEntity).x - candidate[0], (person as PersonEntity).y - candidate[1])
    return distance < radius + (person as PersonEntity).radius
  })

  if (collidesPerson) {
    return true
  }

  const relevantWalls = areaId
    ? walls.filter((wall) => getEntityAreaId(wall as SceneEntity) === areaId)
    : walls
  const hitsWall = relevantWalls.some((wallEntity) => {
    const wall = wallEntity as SceneEntity & {
      points: GeoPoint[]
      thickness?: number
    }
    if (wall.points.length < 2) {
      return false
    }
    const threshold = radius + (wall.thickness ?? 0)
    return wall.points.some((pt, index) => {
      if (index === wall.points.length - 1) {
        return false
      }
      const next = wall.points[index + 1]
      return distanceToSegment(candidate, pt, next) < threshold
    })
  })

  if (hitsWall) {
    return true
  }

  const relevantShapes = areaId
    ? shapes.filter((shape) => getEntityAreaId(shape as SceneEntity) === areaId)
    : shapes
  const hitsShape = relevantShapes.some((shapeEntity) => {
    const shape = shapeEntity as SceneEntity & {
      geometry: GeoPoint[]
      shapeType: string
    }
    if (shape.shapeType === 'line' || shape.geometry.length < 3) {
      return false
    }
    const ringCoords = closeRing(shape.geometry)
    if (ringCoords.length < 4) {
      return false
    }
    const ring = polygon([ringCoords])
    try {
      return booleanPointInPolygon(turfPoint(candidate), ring)
    } catch {
      return false
    }
  })

  return hitsShape
}

const computeMoveTransform = ({
  transformSession,
  mapPoint,
  selectedEntities,
  entityIndex,
  getAreaForEntity,
  getEntityAreaId,
  isGeometryInsideAreaSelection: isInsideArea,
  isPersonPositionBlocked,
  translatePoints: translate,
  walls,
  shapes,
  cameras,
  people,
}: MoveTransformParams): TransformComputationResult => {
  const updates: Record<string, GeoPoint[]> = {}
  let blockedArea: string | null = null

  const deltaLng = mapPoint[0] - transformSession.startPoint[0]
  const deltaLat = mapPoint[1] - transformSession.startPoint[1]
  const movingAreaIds = new Set(
    selectedEntities
      .filter((entity) => entity.type === 'area')
      .map((entity) => entity.id),
  )

  Object.entries(transformSession.originalGeometries).forEach(([id, original]) => {
    const entity = entityIndex.get(id)
    const nextPoints = translate(original, deltaLng, deltaLat)
    const areaForEntity = getAreaForEntity(id)
    const areaIsMoving = areaForEntity && movingAreaIds.has(areaForEntity.id)
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
      const insideArea = isInsideArea(nextPoints, areaForEntity)
      if (!insideArea) {
        blockedArea = areaForEntity?.id ?? null
        return
      }
    }
    updates[id] = nextPoints
  })

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
          updates[entityId] = translate(base, deltaLng, deltaLat)
        })
      }

      const associatedIds = [
        ...walls
          .filter((wall) => getEntityAreaId(wall as SceneEntity) === areaId)
          .map((wall) => (wall as SceneEntity).id),
        ...shapes
          .filter((shape) => getEntityAreaId(shape as SceneEntity) === areaId)
          .map((shape) => (shape as SceneEntity).id),
        ...cameras
          .filter((camera) => getEntityAreaId(camera as SceneEntity) === areaId)
          .map((camera) => (camera as SceneEntity).id),
        ...people
          .filter((person) => getEntityAreaId(person as SceneEntity) === areaId)
          .map((person) => (person as SceneEntity).id),
      ]

      moveAssociated(associatedIds)
    })

  if (blockedArea) {
    return {updates: {}, constraintAreaId: blockedArea, cursor: 'not-allowed'}
  }

  return {updates, constraintAreaId: null, cursor: 'move'}
}

const computeResizeTransform = ({
  transformSession,
  mapPoint,
  entityIndex,
  getAreaForEntity,
  getEntityAreaId,
  isGeometryInsideAreaSelection: isInsideArea,
  isPersonPositionBlocked,
  scalePoints: scale,
  walls,
  shapes,
  cameras,
  people,
  originalBounds,
  modifiers,
}: ResizeTransformParams): TransformComputationResult => {
  const bounds =
    originalBounds ??
    computeBounds(Object.values(transformSession.originalGeometries).flatMap((points) => points))
  if (!bounds) {
    return {updates: {}, constraintAreaId: null}
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
    sw: [bounds.minLng, bounds.maxLat],
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
  const startHandle = initialHandle[handleType] ?? transformSession.startPoint

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

  Object.entries(transformSession.originalGeometries).forEach(([id, original]) => {
    const entity = entityIndex.get(id)
    const scaled = scale(original, anchor, scaleX, scaleY)
    const areaForEntity = getAreaForEntity(id)
    if (entity?.type === 'area') {
      const previewArea = {
        ...(entity as AreaEntity),
        geometry: {
          ...(entity as AreaEntity).geometry,
          coordinates: scaled,
        },
      }
      const relatedEntities: SceneEntity[] = [
        ...walls,
        ...shapes,
        ...cameras,
        ...people,
      ] as SceneEntity[]
      const hasOutsideChild = relatedEntities.some((child) => {
        if (getEntityAreaId(child) !== entity.id) {
          return false
        }
        return !isInsideArea(getEntityPoints(child), previewArea)
      })
      if (hasOutsideChild) {
        blockedArea = entity.id
        return
      }
    }
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
    if (!isInsideArea(scaled, areaForEntity)) {
      blockedArea = areaForEntity?.id ?? null
      return
    }
    updates[id] = scaled
  })

  if (blockedArea) {
    return {updates: {}, constraintAreaId: blockedArea, cursor: 'not-allowed'}
  }

  return {
    updates,
    constraintAreaId: null,
    cursor: getHandleCursor(handleType),
  }
}

const computeRotateTransform = ({
  transformSession,
  mapPoint,
  entityIndex,
  getAreaForEntity,
  isGeometryInsideAreaSelection: isInsideArea,
  isPersonPositionBlocked,
  rotatePoints: rotate,
  origin,
}: RotateTransformParams): TransformComputationResult => {
  const startAngle = Math.atan2(
    transformSession.startPoint[1] - origin[1],
    transformSession.startPoint[0] - origin[0],
  )
  const currentAngle = Math.atan2(mapPoint[1] - origin[1], mapPoint[0] - origin[0])
  const deltaDeg = ((currentAngle - startAngle) * 180) / Math.PI

  const updates: Record<string, GeoPoint[]> = {}
  let blockedArea: string | null = null

  Object.entries(transformSession.originalGeometries).forEach(([id, original]) => {
    const entity = entityIndex.get(id)
    const areaForEntity = getAreaForEntity(id)
    if (
      entity?.type === 'person' &&
      isPersonPositionBlocked(
        rotate(original, origin, deltaDeg)[0] as GeoPoint,
        entity.id,
        (entity as PersonEntity).radius,
        areaForEntity?.id,
      )
    ) {
      blockedArea = areaForEntity?.id ?? null
      return
    }
    const rotated = rotate(original, origin, deltaDeg)
    if (!isInsideArea(rotated, areaForEntity)) {
      blockedArea = areaForEntity?.id ?? null
      return
    }
    updates[id] = rotated
  })

  if (blockedArea) {
    return {updates: {}, constraintAreaId: blockedArea, cursor: 'not-allowed'}
  }

  return {
    updates,
    constraintAreaId: null,
    cursor: ROTATE_CURSOR,
    tooltipText: `Rotation: ${deltaDeg.toFixed(0)}°`,
  }
}

// eslint-disable-next-line max-lines-per-function
export const useSelectionTransform = ({
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
  duplicateEntities,
  setTooltip,
  setCursorOverride,
  baseCursor,
}: UseSelectionTransformParams): UseSelectionTransformResult => {
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

  const getMapInstance = React.useCallback(
    (): MapboxMap | null => mapRef.current?.getMap?.() ?? null,
    [mapRef],
  )

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

  const getEntityAreaId = React.useCallback(
    (entity: SceneEntity): string | undefined =>
      'areaId' in entity ? entity.areaId : undefined,
    [],
  )

  const getAreaForEntity = React.useCallback(
    (id: string) => {
      const entity = entityIndex.get(id)
      if (!entity || entity.type === 'area') {
        return undefined
      }
      const areaId = getEntityAreaId(entity)
      if (!areaId) {
        return undefined
      }
      return areas.find((area) => area.id === areaId)
    },
    [areas, entityIndex, getEntityAreaId],
  )

  const scheduleHoverTooltip = React.useCallback(
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
    [setTooltip],
  )

  const clearHoverTooltip = React.useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setTooltip(null)
  }, [setTooltip])

  const getSourcesForId = React.useCallback((id: string) => {
    if (id.startsWith('area-')) return ['areas']
    if (id.startsWith('wall-')) return ['walls']
    if (id.startsWith('shape-')) return ['shapes']
    if (id.startsWith('camera-'))
      return ['cameras', 'camera-fovs', 'camera-directions']
    if (id.startsWith('person-')) return ['people']
    return []
  }, [])

  React.useEffect(() => {
    const map = getMapInstance()
    syncFeatureStates({
      map,
      mapLoaded,
      selectedEntityIds,
      hoveredFeature: hoveredFeature
        ? {id: hoveredFeature.id, source: hoveredFeature.source}
        : null,
      constraintAreaId,
      getSourcesForId,
      featureStateRef,
    })
  }, [
    constraintAreaId,
    getMapInstance,
    getSourcesForId,
    hoveredFeature,
    mapLoaded,
    selectedEntityIds,
  ])

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

    const map = getMapInstance()
    const {handleFeatures, rotationHandle} = createHandleFeatures(bounds, map)
    setHandleFeatures(handleFeatures)
    setRotationHandle(rotationHandle)
  }, [getMapInstance, selectedEntities])

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

  const hitTestHandles = React.useCallback(
    (
      point: {x: number; y: number},
      featuresFromEvent?: MapboxGeoJSONFeature[],
    ) => {
      const map = getMapInstance()
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
      const handleType = top.properties?.handleType as string | undefined
      if (!handleType) {
        return null
      }
      return {
        handleType,
        role: String(top.properties?.role ?? ''),
      }
    },
    [getMapInstance],
  )

  const hitTestEntities = React.useCallback(
    (
      point: {x: number; y: number},
      featuresFromEvent?: MapboxGeoJSONFeature[],
      geoPoint?: GeoPoint,
    ) => {
      const map = getMapInstance()
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
            const ring = closeRing(getEntityPoints(area))
            if (ring.length < 4) {
              return false
            }
            const areaPolygon = polygon([ring])
            try {
              return booleanPointInPolygon(turfPt, areaPolygon)
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
        }
        return null
      }

      const resolveType = (feature: MapboxGeoJSONFeature) => {
        const rawType =
          (feature.properties?.entityType as string | undefined) ??
          (feature.properties?.type as string | undefined) ??
          LAYER_TYPE_MAP[feature.layer?.id as string]
        if (rawType === 'area' || String(rawType ?? '').includes('area')) {
          return 'area'
        }
        return (
          HIT_TEST_PRIORITY.find((type) =>
            String(rawType ?? '').includes(type),
          ) ?? null
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
    [areas, getMapInstance],
  )

  const applyPointsToScene = React.useCallback(
    (scene: SceneRoot, id: string, points: GeoPoint[]) => {
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
    },
    [],
  )

  const isPersonPositionBlocked = React.useCallback(
    (
      candidate: GeoPoint,
      personId: string,
      radius: number,
      areaId?: string,
    ) => {
      return isPersonPositionBlockedHelper({
        candidate,
        personId,
        radius,
        areaId,
        people,
        walls,
        shapes,
        getEntityAreaId,
      })
    },
    [getEntityAreaId, people, shapes, walls],
  )

  const applyTransformResult = React.useCallback(
    (result: TransformComputationResult, event: MapLayerMouseEvent) => {
      if (result.constraintAreaId) {
        setConstraintAreaId(result.constraintAreaId)
        setCursorOverride('not-allowed')
        return
      }

      setConstraintAreaId(null)
      if (result.cursor) {
        setCursorOverride(result.cursor)
      }
      if (result.tooltipText) {
        setTooltip({
          text: result.tooltipText,
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
      }

      if (Object.keys(result.updates).length > 0) {
        updateScene((scene) => {
          Object.entries(result.updates).forEach(([id, points]) => {
            applyPointsToScene(scene, id, points as GeoPoint[])
          })
          scene.meta.updatedAt = new Date().toISOString()
        })
      }
    },
    [applyPointsToScene, setCursorOverride, setTooltip, updateScene],
  )

  const startTransformSession = React.useCallback(
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
            const collect = <T extends SceneEntity & {areaId: string}>(
              list: T[],
            ) => {
              list
                .filter((item) => item.areaId === areaId)
                .forEach((item) => {
                  if (originalGeometries[item.id]) {
                    return
                  }
                  originalGeometries[item.id] = getEntityPoints(item)
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
    },
    [cameras, people, shapes, walls],
  )

  const processTransformMove = React.useCallback(
    (event: MapLayerMouseEvent, mapPoint: GeoPoint, modifiers?: {shiftKey?: boolean}) => {
      if (!transformSession) {
        return
      }

      if (transformSession.type === 'move') {
        const result = computeMoveTransform({
          transformSession,
          mapPoint,
          selectedEntities,
          entityIndex,
          getAreaForEntity,
          getEntityAreaId,
          isGeometryInsideAreaSelection,
          translatePoints,
          isPersonPositionBlocked,
          walls,
          shapes,
          cameras,
          people,
        })
        applyTransformResult(result, event)
        return
      }

      if (transformSession.type === 'resize' && transformSession.handleType) {
        const result = computeResizeTransform({
          transformSession: transformSession as TransformSession & {handleType: string},
          mapPoint,
          entityIndex,
          getAreaForEntity,
          getEntityAreaId,
          isGeometryInsideAreaSelection,
          isPersonPositionBlocked,
          scalePoints,
          walls,
          shapes,
          cameras,
          people,
          originalBounds: transformSession.originalBounds ?? null,
          modifiers,
        })
        applyTransformResult(result, event)
        return
      }

      if (transformSession.type === 'rotate') {
        const result = computeRotateTransform({
          transformSession,
          mapPoint,
          entityIndex,
          getAreaForEntity,
          isGeometryInsideAreaSelection,
          isPersonPositionBlocked,
          rotatePoints,
          origin: transformSession.origin ?? mapPoint,
        })
        applyTransformResult(result, event)
      }
    },
    [
      applyTransformResult,
      entityIndex,
      getAreaForEntity,
      getEntityAreaId,
      isGeometryInsideAreaSelection,
      isPersonPositionBlocked,
      rotatePoints,
      scalePoints,
      selectedEntities,
      translatePoints,
      transformSession,
      walls,
      shapes,
      cameras,
      people,
    ],
  )

  const handleMapLoad = React.useCallback(() => {
    const map = getMapInstance()
    if (!map) return
    ensureHandleImages(map)
    setMapLoaded(true)
  }, [getMapInstance])

  const onPointerMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]

      if (!isEditMode) {
        setTooltip(null)
        setHoveredFeature(null)
        return false
      }

      if (transformSession) {
        processTransformMove(event, mapPoint, {
          shiftKey: Boolean(
            (event.originalEvent as MouseEvent | undefined)?.shiftKey,
          ),
        })
        return true
      }

      if (activeTool !== 'select') {
        setHoveredFeature(null)
        clearHoverTooltip()
        return false
      }

      const handleHit = hitTestHandles(event.point, event.features)
      if (handleHit) {
        setCursorOverride(getHandleCursor(handleHit.handleType))
        clearHoverTooltip()
        return true
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
      return Boolean(hit)
    },
    [
      activeTool,
      clearHoverTooltip,
      hitTestEntities,
      hitTestHandles,
      isEditMode,
      processTransformMove,
      scheduleHoverTooltip,
      setCursorOverride,
      setTooltip,
      transformSession,
    ],
  )

  const onMouseDown = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'select') {
        return false
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
        return true
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

        if (!shiftKey) {
          const dragEntities =
            selectedEntities.length > 0 && alreadySelected
              ? selectedEntities
              : (() => {
                  const entity = entityIndex.get(hit.id)
                  return entity ? [entity] : []
                })()
          if (dragEntities.length > 0) {
            startTransformSession('move', mapPoint, undefined, dragEntities)
            return true
          }
        }
      } else {
        clearSelection()
      }

      const clickedOnSelection =
        selectedEntities.length > 0 &&
        (selectedEntities.some((entity) => isPointInsideEntity(mapPoint, entity)) ||
          (selectionBounds
            ? booleanPointInPolygon(
                turfPoint(mapPoint),
                polygon([boundsToPolygon(selectionBounds)]),
              )
            : false))

      if (clickedOnSelection) {
        startTransformSession('move', mapPoint, undefined, selectedEntities)
        return true
      }

      return Boolean(hit)
    },
    [
      activeTool,
      clearSelection,
      entityIndex,
      hitTestEntities,
      hitTestHandles,
      isEditMode,
      selectedEntities,
      selectedEntityIds,
      setSelection,
      startTransformSession,
    ],
  )

  const onMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'select') {
        return false
      }
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const shiftKey = Boolean(
        (event.originalEvent as MouseEvent | undefined)?.shiftKey,
      )
      const feature = hitTestEntities(event.point, event.features, mapPoint)
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
      return Boolean(feature)
    },
    [
      activeTool,
      clearSelection,
      hitTestEntities,
      isEditMode,
      selectedEntityIds,
      setSelection,
    ],
  )

  const onMouseUp = React.useCallback(() => {
    if (transformSession) {
      if (transformSession.type === 'rotate') {
        setTooltip(null)
      }
      setTransformSession(null)
      setConstraintAreaId(null)
    }
  }, [setTooltip, transformSession])

  const onDeleteSelection = React.useCallback(() => {
    if (!selectedEntityIds.length) {
      return
    }
    deleteEntities(selectedEntityIds)
    clearSelection()
  }, [clearSelection, deleteEntities, selectedEntityIds])

  const onDuplicateSelection = React.useCallback(() => {
    if (!selectedEntityIds.length) {
      return
    }
    duplicateEntities(selectedEntityIds)
  }, [duplicateEntities, selectedEntityIds])

  const selectionCount = selectedEntityIds.length

  const cursor = baseCursor

  return {
    selectionBoundsFeature,
    handleFeatures,
    rotationHandle,
    constraintAreaId,
    hoveredFeature,
    cursor,
    selectionCount,
    onPointerMove,
    onMouseDown,
    onMapClick,
    onMouseUp,
    onMapLoad: handleMapLoad,
    onDeleteSelection,
    onDuplicateSelection,
    mapLoaded,
  }
}
