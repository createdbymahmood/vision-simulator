import type {MapRef} from 'react-map-gl/mapbox'

import React from 'react'

import type {EditorMode} from '@/features/scene/types/types'

interface UseCanvasEmptyZoomParams {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
  editorMode: EditorMode
  areaCount: number
  zoom?: number
  duration?: number
  defaultZoom?: number
}

export const useCanvasEmptyZoom = ({
  mapRef,
  mapLoaded,
  editorMode,
  areaCount,
  zoom = 21,
  duration = 400,
  defaultZoom = 10,
}: UseCanvasEmptyZoomParams) => {
  const initialZoom = React.useMemo(() => {
    if (editorMode === 'canvas' && areaCount === 0) {
      return zoom
    }
    return defaultZoom
  }, [areaCount, defaultZoom, editorMode, zoom])

  React.useEffect(() => {
    if (!mapLoaded || editorMode !== 'canvas' || areaCount > 0) {
      return
    }
    const map = mapRef.current?.getMap?.()
    if (!map) {
      return
    }
    map.flyTo({zoom, duration})
  }, [areaCount, duration, mapLoaded, mapRef, editorMode, zoom])

  return {initialZoom}
}
