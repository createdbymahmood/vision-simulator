import React from 'react'

import type {FeatureCollection, LineString, Point, Polygon} from 'geojson'
import type {MapMouseEvent} from 'react-map-gl/mapbox'

import {toast} from 'sonner'

import type {
  AreaEntity,
  CameraEntity,
  GeoPoint,
  SceneRoot,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'
import type {TooltipState} from '@/features/scene/presentation/components/map-view/map-view-types'

import {
  createCircleRing,
  createFovRing,
  formatMeters,
  isPointInsideArea,
  projectPoint,
} from './map-view-helpers'
import {getCameraPreset} from '@/features/scene/domain/constants/camera-presets'
import {assignCameraColor} from '@/features/scene/domain/services/color-assignment'

type MapLayerMouseEvent = MapMouseEvent

interface CameraPlacementState {
  presetId: string | null
  color: string | null
}

interface UseCameraPlacementParams {
  activeTool: EditorTool
  isEditMode: boolean
  areas: AreaEntity[]
  cameras: CameraEntity[]
  cameraPlacement: CameraPlacementState
  setCameraPlacement: (presetId: string | null, color: string | null) => void
  clearCameraPlacement: () => void
  addCamera: (
    camera: Omit<CameraEntity, 'id' | 'type' | 'ptz' | 'ptzPresets'>,
  ) => SceneRoot
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
}

interface UseCameraPlacementResult {
  preview: CameraPreviewData | null
  onPointerMove: (event: MapLayerMouseEvent) => boolean
  onMapClick: (event: MapLayerMouseEvent) => boolean
}

const createEmptyPreview = (): CameraPreviewData => ({
  point: {type: 'FeatureCollection', features: []} as FeatureCollection<Point>,
  fov: {type: 'FeatureCollection', features: []} as FeatureCollection<Polygon>,
  direction: {type: 'FeatureCollection', features: []} as FeatureCollection<LineString>,
  range: {type: 'FeatureCollection', features: []} as FeatureCollection<LineString>,
  isValid: false,
})

export const useCameraPlacement = ({
  activeTool,
  isEditMode,
  areas,
  cameras,
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

  const getAreaAtPoint = React.useCallback(
    (point: GeoPoint) =>
      areas.find((area) => isPointInsideArea(point, area)) ?? null,
    [areas],
  )

  const resolvePreset = React.useCallback(() => {
    const defaultPresetId = 'static-hd'
    const presetId = cameraPlacement.presetId ?? defaultPresetId
    return getCameraPreset(presetId) ?? getCameraPreset(defaultPresetId)
  }, [cameraPlacement.presetId])

  const ensurePlacementColor = React.useCallback(() => {
    if (cameraPlacement.color) {
      return cameraPlacement.color
    }
    const nextColor = assignCameraColor(cameras.length)
    setCameraPlacement(cameraPlacement.presetId, nextColor)
    return nextColor
  }, [cameraPlacement.color, cameraPlacement.presetId, cameras.length, setCameraPlacement])

  const updatePreview = React.useCallback(
    (point: GeoPoint) => {
      const preset = resolvePreset()
      if (!preset) {
        return createEmptyPreview()
      }
      const color = ensurePlacementColor()
      const ring = createFovRing(point, 0, preset.fov, preset.depth)
      const directionPoint = projectPoint(point, 0, preset.depth * 0.6)
      const rangeRing = createCircleRing(point, preset.depth, 72)
      const areaForPoint = getAreaAtPoint(point)

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
        isValid: Boolean(areaForPoint),
      }
    },
    [ensurePlacementColor, getAreaAtPoint, resolvePreset],
  )

  const onPointerMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-camera') {
        return false
      }
      const point: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const nextPreview = updatePreview(point)
      setPreview(nextPreview)
      if (areas.length === 0) {
        setTooltip({
          text: 'Create an area first',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        setCursorOverride('not-allowed')
        return true
      }
      if (!nextPreview.isValid) {
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
        text: `Camera • Range: ${formatMeters(
          resolvePreset()?.depth ?? 0,
        )}`,
        x: event.point.x + 12,
        y: event.point.y + 12,
        visible: true,
      })
      return true
    },
    [
      activeTool,
      isEditMode,
      areas.length,
      resolvePreset,
      setCursorOverride,
      setTooltip,
      updatePreview,
    ],
  )

  const onMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-camera') {
        return false
      }
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const preset = resolvePreset()
      const color = ensurePlacementColor()

      const areaForPlacement = getAreaAtPoint(mapPoint)

      if (!areaForPlacement) {
        toast.error('Cannot place camera outside area')
        setCursorOverride('not-allowed')
        return true
      }

      const updatedScene = addCamera({
        typePreset: preset?.id ?? 'static-hd',
        areaId: areaForPlacement.id,
        x: mapPoint[0],
        y: mapPoint[1],
        name: preset?.name ?? 'Camera',
        height: preset?.height ?? 3,
        direction: 0,
        fov: preset?.fov ?? 90,
        depth: preset?.depth ?? 20,
        zoom: preset?.zoom ?? 1,
        nearClipping: preset?.nearClipping ?? 0.5,
        resolution: preset?.resolution ?? {width: 1920, height: 1080},
        color,
        showCollisions: true,
      })

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
      isEditMode,
      openCameraPanel,
      resolvePreset,
      getAreaAtPoint,
      setActiveTool,
      setSelection,
      setCursorOverride,
    ],
  )

  React.useEffect(() => {
    if (activeTool !== 'place-camera') {
      setPreview(null)
      setCursorOverride(undefined)
      setTooltip(null)
    }
  }, [activeTool, setCursorOverride, setTooltip])

  return {preview, onPointerMove, onMapClick}
}
