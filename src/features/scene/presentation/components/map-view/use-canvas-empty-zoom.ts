import type {MapRef} from 'react-map-gl/mapbox'

import React from 'react'

import type {SceneMode} from '@/features/scene/domain/types'

interface UseCanvasEmptyZoomParams {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
  sceneMode: SceneMode
  areaCount: number
  zoom?: number
  duration?: number
  defaultZoom?: number
}

export const useCanvasEmptyZoom = ({
  mapRef,
  mapLoaded,
  sceneMode,
  areaCount,
  zoom = 21,
  duration = 400,
  defaultZoom = 10,
}: UseCanvasEmptyZoomParams) => {
  const initialZoom = React.useMemo(() => {
    if (sceneMode === 'canvas' && areaCount === 0) {
      return zoom
    }
    return defaultZoom
  }, [areaCount, defaultZoom, sceneMode, zoom])

  React.useEffect(() => {
    if (!mapLoaded || sceneMode !== 'canvas' || areaCount > 0) {
      return
    }
    const map = mapRef.current?.getMap?.()
    if (!map) {
      return
    }
    map.flyTo({zoom, duration})
  }, [areaCount, duration, mapLoaded, mapRef, sceneMode, zoom])

  return {initialZoom}
}
