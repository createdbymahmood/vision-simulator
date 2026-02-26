import type {Map as MapboxMap} from 'mapbox-gl'
import type {MapRef} from 'react-map-gl/mapbox'

import mapboxgl from 'mapbox-gl'

import type {AreaEntity, SceneRoot} from '@/features/scene/domain/types'

import {ensureCanvasGridImages} from '@/features/scene/presentation/components/map-view/mapbox-grid-images'
import {computeBounds} from '@/features/scene/presentation/components/map-view/selection-geometry'

interface CaptureSceneSnapshotParams {
  mapRef: MapRef | null
  scene: SceneRoot
}

interface CaptureSize {
  height: number
  width: number
}

const CAPTURE_PADDING = 80
const MAP_WAIT_TIMEOUT_MS = 2500
const CAPTURE_BASE_SCALE = 0.6
const CAPTURE_MAX_LONGEST_SIDE = 512
const CAPTURE_MIN_LONGEST_SIDE = 320
const JPEG_QUALITY = 0.68
const SNAPSHOT_HIDDEN_LAYER_IDS = new Set([
  'rotation-connector',
  'selection-bounds-outline',
  'selection-handles-corner',
  'selection-handles-edge',
  'selection-rotation-handle',
])
const SNAPSHOT_HIDDEN_SOURCE_IDS = new Set([
  'rotation-handle-line',
  'selection-bounds',
  'selection-handles',
])

const waitForAnimationFrame = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    window.requestAnimationFrame(() => resolve())
  })

const waitForMapLoad = (map: MapboxMap) =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    if (map.loaded()) {
      resolve()
      return
    }

    let settled = false
    let timeout = 0

    const finish = () => {
      if (settled) {
        return
      }
      settled = true
      map.off('load', finish)
      window.clearTimeout(timeout)
      resolve()
    }

    timeout = window.setTimeout(finish, MAP_WAIT_TIMEOUT_MS)
    map.once('load', finish)
  })

const waitForMapIdle = (map: MapboxMap) =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    let settled = false
    let timeout = 0

    const finish = () => {
      if (settled) {
        return
      }
      settled = true
      map.off('idle', finish)
      window.clearTimeout(timeout)
      resolve()
    }

    timeout = window.setTimeout(finish, MAP_WAIT_TIMEOUT_MS)
    map.once('idle', finish)
  })

const createJpegBlob = async (canvas: HTMLCanvasElement) => {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/jpeg', JPEG_QUALITY)
  })

  if (blob) {
    return blob
  }

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const response = await fetch(dataUrl)
  return response.blob()
}

const resolveCaptureArea = (scene: SceneRoot): AreaEntity | null => {
  if (scene.activeAreaId) {
    const activeArea = scene.areas.find(
      (area) => area.id === scene.activeAreaId,
    )
    if (activeArea) {
      return activeArea
    }
  }

  return scene.areas[0] ?? null
}

const resolveCaptureSize = (map: MapboxMap): CaptureSize => {
  const mapContainer = map.getContainer()
  const viewportWidth = Math.max(
    1,
    mapContainer.clientWidth || map.getCanvas().width || 1,
  )
  const viewportHeight = Math.max(
    1,
    mapContainer.clientHeight || map.getCanvas().height || 1,
  )
  const longestSide = Math.max(viewportWidth, viewportHeight)

  const targetLongestSide = Math.max(
    CAPTURE_MIN_LONGEST_SIDE,
    Math.min(
      CAPTURE_MAX_LONGEST_SIDE,
      Math.round(longestSide * CAPTURE_BASE_SCALE),
    ),
  )

  const scale = targetLongestSide / longestSide

  return {
    width: Math.max(1, Math.round(viewportWidth * scale)),
    height: Math.max(1, Math.round(viewportHeight * scale)),
  }
}

const createOffscreenContainer = ({height, width}: CaptureSize) => {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.pointerEvents = 'none'
  container.style.opacity = '0'
  container.style.zIndex = '-1'
  document.body.appendChild(container)
  return container
}

const sanitizeSnapshotStyle = (style: Record<string, unknown>) => {
  const layers = style.layers
  if (Array.isArray(layers)) {
    style.layers = layers.filter((layer) => {
      const layerId =
        layer && typeof layer === 'object' && 'id' in layer
          ? (layer as {id?: unknown}).id
          : undefined

      return !(
        typeof layerId === 'string' && SNAPSHOT_HIDDEN_LAYER_IDS.has(layerId)
      )
    })
  }

  const sources = style.sources
  if (!sources || typeof sources !== 'object') {
    return style
  }

  const mutableSources = Object.fromEntries(
    Object.entries(sources as Record<string, unknown>).filter(
      ([sourceId]) => !SNAPSHOT_HIDDEN_SOURCE_IDS.has(sourceId),
    ),
  )

  style.sources = mutableSources
  return style
}

const cloneMapStyle = (map: MapboxMap) => {
  const style = map.getStyle()
  const clonedStyle =
    typeof structuredClone === 'function'
      ? structuredClone(style)
      : JSON.parse(JSON.stringify(style))

  return sanitizeSnapshotStyle(clonedStyle as Record<string, unknown>)
}

const resolveMapAccessToken = (map: MapboxMap): string | undefined => {
  const requestManager = (
    map as unknown as {
      _requestManager?: {
        _customAccessToken?: string
      }
    }
  )._requestManager

  const customAccessToken = requestManager?._customAccessToken
  if (typeof customAccessToken === 'string' && customAccessToken.length > 0) {
    return customAccessToken
  }

  if (
    typeof mapboxgl.accessToken === 'string' &&
    mapboxgl.accessToken.length > 0
  ) {
    return mapboxgl.accessToken
  }

  return undefined
}

const createCaptureMap = (
  sourceMap: MapboxMap,
  container: HTMLDivElement,
): MapboxMap => {
  const center = sourceMap.getCenter()

  return new mapboxgl.Map({
    attributionControl: false,
    bearing: sourceMap.getBearing(),
    center: [center.lng, center.lat],
    container,
    fadeDuration: 0,
    interactive: false,
    pitch: sourceMap.getPitch(),
    preserveDrawingBuffer: true,
    projection: 'mercator',
    accessToken: resolveMapAccessToken(sourceMap),
    style: cloneMapStyle(sourceMap),
    trackResize: false,
    zoom: sourceMap.getZoom(),
  })
}

const fitMapToArea = async (map: MapboxMap, area: AreaEntity | null) => {
  if (!area) {
    return
  }

  const bounds = computeBounds(area.geometry.coordinates)
  if (!bounds) {
    return
  }

  const hasSpan =
    bounds.maxLng !== bounds.minLng || bounds.maxLat !== bounds.minLat

  if (hasSpan) {
    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {duration: 0, padding: CAPTURE_PADDING},
    )
  } else {
    map.jumpTo({center: [bounds.minLng, bounds.minLat]})
  }

  await waitForMapIdle(map)
}

export const captureSceneSnapshot = async ({
  mapRef,
  scene,
}: CaptureSceneSnapshotParams): Promise<Blob> => {
  if (typeof window === 'undefined') {
    throw new Error('Snapshot unavailable: browser environment required')
  }

  const map = mapRef?.getMap?.()
  if (!map) {
    throw new Error('Snapshot unavailable: map is not ready')
  }

  const captureSize = resolveCaptureSize(map)
  const captureContainer = createOffscreenContainer(captureSize)
  let captureMap: MapboxMap | null = null

  try {
    captureMap = createCaptureMap(map, captureContainer)
    await waitForMapLoad(captureMap)
    captureMap.resize()
    captureMap.triggerRepaint()
    ensureCanvasGridImages(captureMap)
    await waitForMapIdle(captureMap)
    await fitMapToArea(captureMap, resolveCaptureArea(scene))
    await waitForAnimationFrame()

    return await createJpegBlob(captureMap.getCanvas())
  } catch {
    throw new Error('Failed to capture scene snapshot')
  } finally {
    try {
      captureMap?.remove()
      captureContainer.remove()
    } catch {
      // Ensure offscreen map resources are cleaned up.
    }
  }
}
