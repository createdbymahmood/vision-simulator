import type {FeatureCollection, Point, Polygon} from 'geojson'
import type {MapMouseEvent, MapRef} from 'react-map-gl/mapbox'

import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  GeoPoint,
  PersonEntity,
  SceneRoot,
  ShapeEntity,
  WallEntity,
} from '@/features/scene/domain/types'
import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'
import type {TooltipState} from '@/features/scene/presentation/components/map-view/map-view-types'

import {
  DEFAULT_PERSON_HEIGHT,
  DEFAULT_PERSON_RADIUS,
  DEFAULT_PERSON_SPEED,
} from '@/features/scene/domain/constants/person-defaults'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

import {
  createCircleRing,
  formatMeters,
  getPersonCollision,
  isPointInsideArea,
} from './map-view-helpers'

type MapLayerMouseEvent = MapMouseEvent

interface PersonPreviewData {
  circle: FeatureCollection<Polygon>
  point: FeatureCollection<Point>
  isValid: boolean
  color: string
  reason?: string
}

interface UsePersonPlacementParams {
  activeTool: EditorTool
  isEditMode: boolean
  mapRef: React.RefObject<MapRef | null>
  areas: AreaEntity[]
  walls: WallEntity[]
  shapes: ShapeEntity[]
  people: PersonEntity[]
  addPerson: (person: Omit<PersonEntity, 'id' | 'type'>) => SceneRoot
  setSelection: (ids: string[]) => void
  setActiveTool: (tool: EditorTool) => void
  openPersonPanel: () => void
  setTooltip: (tooltip: TooltipState | null) => void
  setCursorOverride: (cursor?: string) => void
}

interface UsePersonPlacementResult {
  preview: PersonPreviewData | null
  onPointerMove: (event: MapLayerMouseEvent) => boolean
  onMapClick: (event: MapLayerMouseEvent) => boolean
}

const createEmptyPreview = (): PersonPreviewData => ({
  circle: {
    type: 'FeatureCollection',
    features: [],
  } as FeatureCollection<Polygon>,
  point: {type: 'FeatureCollection', features: []} as FeatureCollection<Point>,
  isValid: false,
  color: '#4ECDC4',
})

export const usePersonPlacement = ({
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
  openPersonPanel,
  setTooltip,
  setCursorOverride,
}: UsePersonPlacementParams): UsePersonPlacementResult => {
  const [preview, setPreview] = React.useState<PersonPreviewData | null>(null)
  const {recordAction} = useHistoryRecorder()

  const getAreaAtPoint = React.useCallback(
    (point: GeoPoint) =>
      areas.find((area) => isPointInsideArea(point, area)) ?? null,
    [areas],
  )

  const buildPreview = React.useCallback(
    (point: GeoPoint, isValid: boolean, color: string): PersonPreviewData => {
      const ring = createCircleRing(point, DEFAULT_PERSON_RADIUS, 36)
      return {
        circle: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'person-preview-circle',
              properties: {color},
              geometry: {type: 'Polygon', coordinates: [ring]},
            },
          ],
        } as FeatureCollection<Polygon>,
        point: {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'person-preview-point',
              properties: {color},
              geometry: {type: 'Point', coordinates: point},
            },
          ],
        } as FeatureCollection<Point>,
        isValid,
        color,
      }
    },
    [],
  )

  const validatePlacement = React.useCallback(
    (point: GeoPoint) => {
      const area = getAreaAtPoint(point)
      if (!area) {
        return {
          isValid: false,
          reason: 'Outside area boundary',
          areaId: null,
        } as const
      }

      const collision = getPersonCollision({
        candidate: point,
        radius: DEFAULT_PERSON_RADIUS,
        areaId: area.id,
        people,
        walls,
        shapes,
      })

      if (collision.blocked) {
        const reason =
          collision.type === 'person'
            ? 'Too close to another person'
            : collision.type === 'wall'
              ? 'Overlaps with wall'
              : 'Overlaps with shape'
        return {
          isValid: false,
          reason,
          areaId: area.id,
        } as const
      }

      return {isValid: true, areaId: area.id, reason: undefined} as const
    },
    [getAreaAtPoint, people, shapes, walls],
  )

  const onPointerMove = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-person') {
        return false
      }
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]

      if (areas.length === 0) {
        setTooltip({
          text: 'Create an area first',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        setCursorOverride('not-allowed')
        setPreview(createEmptyPreview())
        return true
      }

      const validation = validatePlacement(mapPoint)
      const isValid = validation.isValid
      const color = isValid ? '#4ECDC4' : '#EF4444'
      setPreview(buildPreview(mapPoint, isValid, color))

      if (!isValid) {
        setCursorOverride('not-allowed')
        setTooltip({
          text: validation.reason ?? 'Cannot place person here',
          x: event.point.x + 12,
          y: event.point.y + 12,
          visible: true,
        })
        return true
      }

      setCursorOverride('none')
      setTooltip({
        text: `Person • Radius: ${formatMeters(DEFAULT_PERSON_RADIUS)}`,
        x: event.point.x + 12,
        y: event.point.y + 12,
        visible: true,
      })
      return true
    },
    [
      activeTool,
      areas.length,
      buildPreview,
      isEditMode,
      setCursorOverride,
      setTooltip,
      validatePlacement,
    ],
  )

  const pulseNewPerson = React.useCallback(
    (id: string) => {
      const map = mapRef.current?.getMap?.()
      if (!map) return
      if (!map.getSource('people')) {
        window.setTimeout(() => pulseNewPerson(id), 80)
        return
      }
      map.setFeatureState({source: 'people', id}, {pulse: true})
      window.setTimeout(() => {
        map.setFeatureState({source: 'people', id}, {pulse: false})
      }, 250)
    },
    [mapRef],
  )

  const onMapClick = React.useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isEditMode || activeTool !== 'place-person') {
        return false
      }
      const mapPoint: GeoPoint = [event.lngLat.lng, event.lngLat.lat]
      const validation = validatePlacement(mapPoint)

      if (!validation.isValid || !validation.areaId) {
        setCursorOverride('not-allowed')
        const reason =
          validation.reason === 'Outside area boundary'
            ? 'Cannot place object outside area boundaries'
            : (validation.reason ?? 'Cannot place person here')
        toast.error(reason)
        return true
      }

      const updated = addPerson({
        areaId: validation.areaId,
        name: 'Person',
        x: mapPoint[0],
        y: mapPoint[1],
        height: DEFAULT_PERSON_HEIGHT,
        speed: DEFAULT_PERSON_SPEED,
      })
      recordAction({type: 'add', entity: 'person'}, updated)

      const newPersonId = updated?.people?.at(-1)?.id
      if (newPersonId) {
        setSelection([newPersonId])
        setActiveTool('select')
        openPersonPanel()
        pulseNewPerson(newPersonId)
        toast.success('Person placed')
      }
      return true
    },
    [
      activeTool,
      addPerson,
      isEditMode,
      openPersonPanel,
      pulseNewPerson,
      setActiveTool,
      setCursorOverride,
      setSelection,
      validatePlacement,
      recordAction,
    ],
  )

  React.useEffect(() => {
    if (activeTool !== 'place-person') {
      setPreview(null)
      setCursorOverride(undefined)
      setTooltip(null)
    }
  }, [activeTool, setCursorOverride, setTooltip])

  return {preview, onPointerMove, onMapClick}
}
