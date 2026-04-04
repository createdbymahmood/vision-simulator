import type {MapRef} from 'react-map-gl/mapbox'

import React from 'react'

import type {AreaEntity} from '@/features/scene/types/types'

import {computeBounds} from './selection-geometry'

interface UseFlyToActiveAreaParams {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
  activeAreaId?: string
  areas: AreaEntity[]
  flyToActiveAreaTick?: number
}

export const useFlyToActiveArea = ({
  mapRef,
  mapLoaded,
  activeAreaId,
  areas,
  flyToActiveAreaTick = 0,
}: UseFlyToActiveAreaParams) => {
  const areasRef = React.useRef<AreaEntity[]>(areas)

  React.useEffect(() => {
    areasRef.current = areas
  }, [areas])

  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current || !activeAreaId) {
      return
    }
    const activeArea = areasRef.current.find((area) => area.id === activeAreaId)
    if (!activeArea) {
      return
    }
    const bounds = computeBounds(activeArea.geometry.coordinates)
    if (!bounds) {
      return
    }
    const hasSpan =
      bounds.maxLng !== bounds.minLng || bounds.maxLat !== bounds.minLat
    if (hasSpan) {
      mapRef.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        {padding: 80, duration: 600},
      )
    } else {
      mapRef.current.flyTo({
        center: {lng: bounds.minLng, lat: bounds.minLat},
        duration: 600,
      })
    }
  }, [activeAreaId, flyToActiveAreaTick, mapLoaded, mapRef])
}
