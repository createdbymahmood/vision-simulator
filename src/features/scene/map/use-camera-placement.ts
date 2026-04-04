import type {FeatureCollection, LineString, Point, Polygon} from 'geojson'
import type {MapMouseEvent} from 'react-map-gl/mapbox'

import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  CameraEntity,
  CameraPlacementProfile,
  GeoPoint,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/types/types'
import type {EditorTool} from '@/features/scene/state/ui.store'
import type {TooltipState} from '@/features/scene/map/map-view-types'

import {createDefaultCameraOptics} from '@/features/scene/services/camera-optics'
import {assignCameraColor} from '@/features/scene/services/color-assignment'
import {useHistoryRecorder} from '@/features/scene/hooks/use-history-recorder'

import {
  buildFovOcclusionObstacles,
  buildOccludedFovRing,
  computeArea,
  createCircleRing,
  createFovRing,
  formatMeters,
  isPointInsideArea,
  projectPoint,
} from './map-view-helpers'
import {useCameraPreviewFovWorker} from './use-camera-preview-fov-worker'

type MapLayerMouseEvent = MapMouseEvent

const DEFAULT_CAMERA_PLACEMENT_PROFILE: CameraPlacementProfile = {
  id: 'manual-camera',
  name: 'Camera',
  description: 'Generic camera',
  sourceDeviceKind: 'virtual',
  optics: createDefaultCameraOptics(),
  features: [],
}

interface CameraPlacementState {
  profile: CameraPlacementProfile | null
  color: string | null
}

interface UseCameraPlacementParams {
  activeTool: EditorTool
  isEditMode: boolean
  areas: AreaEntity[]
  cameras: CameraEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  cameraPlacement: CameraPlacementState
  setCameraPlacement: (
    profile: CameraPlacementProfile | null,
    color: string | null,
  ) => void
  clearCameraPlacement: () => void
  addCamera: (camera: Omit<CameraEntity, 'id' | 'ptz' | 'type'>) => SceneRoot
  setSelection: (ids: string[]) => void
  setActiveTool: (tool: EditorTool) => void
  openCameraPanel: () => void
  setTooltip: (tooltip: TooltipState | null) => void
  setCursorOverride: (cursor?: string) => void
}

interface CameraPreviewData {
  point: FeatureCollection<Point>
  fov: FeatureCollection<Polygon>
  direction: FeatureCollection<LineString>
  range: FeatureCollection<LineString>
  isValid: boolean
  isBlocked: boolean
}

interface UseCameraPlacementResult {
  preview: CameraPreviewData | null
  onPointerMove: (event: MapLayerMouseEvent) => boolean
  onMapClick: (event: MapLayerMouseEvent) => boolean
}

const MIN_FOV_PREVIEW_AREA = 0.5
const PREVIEW_FOV_SEGMENTS = 18
const PREVIEW_RANGE_SEGMENTS = 36

interface PreviewComputationMeta {
  requestId: number
  areaId?: string
  point: GeoPoint
  pointer: {x: number; y: number}
  color: string
  profile: CameraPlacementProfile
}

// eslint-disable-next-line max-lines-per-function
export const useCameraPlacement = ({
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
  openCameraPanel,
  setTooltip,
  setCursorOverride,
}: UseCameraPlacementParams): UseCameraPlacementResult => {
  const [preview, setPreview] = React.useState<CameraPreviewData | null>(null)
  const {recordAction} = useHistoryRecorder()

  const getAreaAtPoint = React.useCallback(
    (point: GeoPoint) =>
      areas.find((area) => isPointInsideArea(point, area)) ?? null,
    [areas],
  )

  const resolvePlacementProfile = React.useCallback(
    () => cameraPlacement.profile ?? DEFAULT_CAMERA_PLACEMENT_PROFILE,
    [cameraPlacement.profile],
  )

  const ensurePlacementColor = React.useCallback(() => {
    if (cameraPlacement.color) {
      return cameraPlacement.color
    }
    const nextColor = assignCameraColor(cameras.length)
    setCameraPlacement(cameraPlacement.profile, nextColor)
    return nextColor
  }, [
    cameraPlacement.color,
    cameraPlacement.profile,
    cameras.length,
    setCameraPlacement,
  ])

  const occlusionObstaclesByArea = React.useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildFovOcclusionObstacles>>()
    areas.forEach((area) => {
      const areaWalls = walls.filter((wall) => wall.areaId === area.id)
      const areaShapes = shapes.filter((shape) => shape.areaId === area.id)
      map.set(area.id, buildFovOcclusionObstacles(areaWalls, areaShapes))
    })
    return map
  }, [areas, shapes, walls])

  const latestPreviewRequestRef = React.useRef(0)
  const latestPreviewMetaRef = React.useRef<PreviewComputationMeta | null>(null)

  const buildPreviewData = React.useCallback(
    ({
      point,
      color,
      depth,
      ring,
      isValid,
      isBlocked,
    }: {
      point: GeoPoint
      color: string
      depth: number
      ring: GeoPoint[]
      isValid: boolean
      isBlocked: boolean
    }) => {
      const directionPoint = projectPoint(point, 0, depth * 0.6)
      const rangeRing = createCircleRing(point, depth, PREVIEW_RANGE_SEGMENTS)
      return {
        point: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'camera-preview',
              properties: {
                color,
                entityType: 'camera',
              },
              geometry: {type: 'Point', coordinates: point},
            },
          ],
        } as FeatureCollection<Point>,
        fov: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'camera-preview-fov',
              properties: {color},
              geometry: {type: 'Polygon', coordinates: [ring]},
            },
          ],
        } as FeatureCollection<Polygon>,
        direction: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'camera-preview-direction',
              properties: {color},
              geometry: {
                type: 'LineString',
                coordinates: [point, directionPoint],
              },
            },
          ],
        } as FeatureCollection<LineString>,
        range: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'camera-preview-range',
              properties: {color},
              geometry: {type: 'LineString', coordinates: rangeRing},
            },
          ],
        } as FeatureCollection<LineString>,
        isValid,
        isBlocked,
      }
    },
    [],
  )

  const {requestPreviewFov} = useCameraPreviewFovWorker({
    areas,
    walls,
    shapes,
    onPreviewResult: (result) => {
      const meta = latestPreviewMetaRef.current
      if (!meta || result.requestId !== meta.requestId) {
        return
      }
      const hasVisibleFov = result.area > MIN_FOV_PREVIEW_AREA
      const isBlocked = Boolean(meta.areaId) && !hasVisibleFov
      const nextPreview = buildPreviewData({
        point: meta.point,
        color: meta.color,
        depth: meta.profile.optics.depth,
        ring: result.ring,
        isValid: Boolean(meta.areaId && hasVisibleFov),
        isBlocked,
      })
      setPreview(nextPreview)
      if (!meta.areaId) {
        return
      }
      if (isBlocked) {
        setCursorOverride('not-allowed')
        setTooltip({
          text: 'Camera FOV is blocked by obstacles',
          x: meta.pointer.x + 12,
          y: meta.pointer.y + 12,
          visible: true,
        })
      }
    },
  })

  const onPointerMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-camera') {
        return false
      }
      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const profile = resolvePlacementProfile()
      const color = ensurePlacementColor()
      const areaForPoint = getAreaAtPoint(point)
      const provisionalRing = createFovRing(
        point,
        0,
        profile.optics.fovHorizontal,
        profile.optics.depth,
        PREVIEW_FOV_SEGMENTS,
      )
      setPreview(
        buildPreviewData({
          point,
          color,
          depth: profile.optics.depth,
          ring: provisionalRing,
          isValid: Boolean(areaForPoint),
          isBlocked: false,
        }),
      )

      if (areas.length === 0) {
        latestPreviewMetaRef.current = null
        setTooltip({
          text: 'Create an area first',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        setCursorOverride('not-allowed')
        return true
      }
      if (!areaForPoint) {
        latestPreviewMetaRef.current = null
        setTooltip({
          text: 'Cannot place camera outside area',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        setCursorOverride('not-allowed')
        return true
      }
      setCursorOverride('none')
      setTooltip({
        text: `Camera • HFOV ${profile.optics.fovHorizontal.toFixed(0)}° • VFOV ${profile.optics.fovVertical.toFixed(0)}° • Range ${formatMeters(profile.optics.depth)}`,
        x: event.point.x + 12,
        y: event.point.y + 12,
        visible: true,
      })

      const requestId = latestPreviewRequestRef.current + 1
      latestPreviewRequestRef.current = requestId
      latestPreviewMetaRef.current = {
        requestId,
        areaId: areaForPoint.id,
        point,
        pointer: {x: event.point.x, y: event.point.y},
        color,
        profile,
      }
      const queuedInWorker = requestPreviewFov({
        requestId,
        origin: point,
        direction: 0,
        fov: profile.optics.fovHorizontal,
        depth: profile.optics.depth,
        cameraHeight: profile.optics.height,
        areaId: areaForPoint.id,
      })
      if (queuedInWorker) {
        return true
      }

      const obstacles = occlusionObstaclesByArea.get(areaForPoint.id) ?? []
      const ring = buildOccludedFovRing({
        origin: point,
        direction: 0,
        fov: profile.optics.fovHorizontal,
        depth: profile.optics.depth,
        cameraHeight: profile.optics.height,
        area: areaForPoint,
        obstacles,
      })
      const hasVisibleFov = computeArea(ring) > MIN_FOV_PREVIEW_AREA
      const isBlocked = !hasVisibleFov
      setPreview(
        buildPreviewData({
          point,
          color,
          depth: profile.optics.depth,
          ring,
          isValid: hasVisibleFov,
          isBlocked,
        }),
      )
      if (isBlocked) {
        setTooltip({
          text: 'Camera FOV is blocked by obstacles',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        setCursorOverride('not-allowed')
      }
      return true
    },
    [
      activeTool,
      areas.length,
      buildPreviewData,
      ensurePlacementColor,
      getAreaAtPoint,
      isEditMode,
      occlusionObstaclesByArea,
      requestPreviewFov,
      resolvePlacementProfile,
      setCursorOverride,
      setTooltip,
    ],
  )

  const resolvePlacementArea = React.useCallback(
    (mapPoint: GeoPoint) => {
      const areaForPlacement = getAreaAtPoint(mapPoint)
      if (!areaForPlacement) {
        toast.error('Cannot place camera outside area')
        setCursorOverride('not-allowed')
        return null
      }
      return areaForPlacement
    },
    [getAreaAtPoint, setCursorOverride],
  )

  const isFovPlacementValid = React.useCallback(
    (
      mapPoint: GeoPoint,
      areaForPlacement: AreaEntity,
      profile: CameraPlacementProfile,
    ) => {
      const obstacles = occlusionObstaclesByArea.get(areaForPlacement.id) ?? []
      const fovRing = buildOccludedFovRing({
        origin: mapPoint,
        direction: 0,
        fov: profile.optics.fovHorizontal,
        depth: profile.optics.depth,
        cameraHeight: profile.optics.height,
        area: areaForPlacement,
        obstacles,
      })
      if (computeArea(fovRing) <= MIN_FOV_PREVIEW_AREA) {
        toast.error('Camera FOV is blocked by obstacles')
        setCursorOverride('not-allowed')
        return false
      }
      return true
    },
    [occlusionObstaclesByArea, setCursorOverride],
  )

  const onMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-camera') {
        return false
      }
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const profile = resolvePlacementProfile()
      const color = ensurePlacementColor()

      const areaForPlacement = resolvePlacementArea(mapPoint)
      if (!areaForPlacement) {
        return true
      }
      if (!isFovPlacementValid(mapPoint, areaForPlacement, profile)) {
        return true
      }

      const updatedScene = addCamera({
        sourceDeviceId: profile.id,
        sourceDeviceName: profile.name,
        sourceDeviceKind: profile.sourceDeviceKind,
        sourceDeviceFeatures: profile.features.map((feature) => ({...feature})),
        areaId: areaForPlacement.id,
        x: mapPoint[0],
        y: mapPoint[1],
        name: profile.name,
        height: profile.optics.height,
        fovHorizontal: profile.optics.fovHorizontal,
        fovVertical: profile.optics.fovVertical,
        depth: profile.optics.depth,
        zoom: profile.optics.zoom,
        resolution: profile.optics.resolution,
        color,
      })
      recordAction({type: 'add', entity: 'camera'}, updatedScene)

      const newCameraId = updatedScene.cameras.at(-1)?.id
      if (newCameraId) {
        setSelection([newCameraId])
      }
      setActiveTool('select')
      clearCameraPlacement()
      openCameraPanel()
      toast.success('Camera placed')
      return true
    },
    [
      activeTool,
      addCamera,
      clearCameraPlacement,
      ensurePlacementColor,
      isFovPlacementValid,
      isEditMode,
      openCameraPanel,
      recordAction,
      resolvePlacementArea,
      resolvePlacementProfile,
      setActiveTool,
      setSelection,
    ],
  )

  React.useEffect(() => {
    if (activeTool !== 'place-camera') {
      latestPreviewRequestRef.current = 0
      latestPreviewMetaRef.current = null
      setPreview(null)
      setCursorOverride(undefined)
      setTooltip(null)
    }
  }, [activeTool, setCursorOverride, setTooltip])

  return {preview, onPointerMove, onMapClick}
}
