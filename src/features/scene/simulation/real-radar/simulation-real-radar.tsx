import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import mapboxgl from 'mapbox-gl'
import React from 'react'

import type {
  CameraEntity,
  GeoPoint,
  SceneRoot,
} from '@/features/scene/types/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {useUiStore} from '@/features/scene/state/ui.store'
import {
  computeBounds,
  getBoundsCenter,
} from '@/features/scene/map/selection-geometry'

import type {
  CameraIntrinsics,
  CameraState,
  DetectionState,
} from './real-radar-types'

import {RealDeviceFeedPlayer} from '../real-device-feed-player'
import {SimulationRealRadarActivities} from '../simulation-real-radar-activities'
import {
  createCameraMarkerElement,
  updateCameraMarkerDirection,
  updateCameraMarkerInteractivity,
} from './real-radar-camera-marker-utils'
import {updateDetectionMarkerElement} from './real-radar-detection-marker-utils'
import {buildCameraFovFeatures, cameraColorForId} from './real-radar-fov-utils'
import {useRealRadarRuntime} from './use-real-radar-runtime'

interface SimulationRealRadarProps {
  scene: SceneRoot
  focusAreaId?: string
  size: {width: number; height: number}
  onSelectEntity: (id?: string) => void
}

const fovSourceId = 'simulation-real-radar-fov'

const defaultIntrinsics: CameraIntrinsics = {
  fx: 1_200,
  fy: 1_200,
  cx: 960,
  cy: 540,
  image_height: 1_080,
  image_width: 1_920,
}

const getScopedRealCameras = (scene: SceneRoot, focusAreaId?: string) =>
  scene.cameras.filter(
    (camera) =>
      camera.sourceDeviceKind === 'real' &&
      (!focusAreaId || camera.areaId === focusAreaId),
  )

const getDefaultCameraState = (): CameraState => ({
  camera_lat: 36.2605,
  camera_lon: 59.6168,
  camera_height_m: 8,
  yaw_deg: 45,
  pitch_deg: -10,
  roll_deg: 0,
  intrinsics: defaultIntrinsics,
})

const getMapModeAreaCenter = (
  scene: SceneRoot,
  focusAreaId?: string,
): GeoPoint | null => {
  const resolvedAreaId = focusAreaId ?? scene.activeAreaId
  const targetArea = resolvedAreaId
    ? scene.areas.find((area) => area.id === resolvedAreaId)
    : scene.areas[0]

  if (!targetArea) {
    return null
  }

  const bounds = computeBounds(targetArea.geometry.coordinates)
  if (!bounds) {
    return null
  }

  return getBoundsCenter(bounds)
}

const getCameraByIncomingId = (cameras: CameraEntity[]) => {
  return cameras.reduce<Record<string, CameraEntity>>((acc, camera) => {
    if (camera.id) {
      acc[camera.id] = camera
    }

    if (camera.sourceDeviceId) {
      acc[camera.sourceDeviceId] = camera
    }

    return acc
  }, {})
}

// eslint-disable-next-line max-lines-per-function
export const SimulationRealRadar: React.FC<SimulationRealRadarProps> = ({
  scene,
  focusAreaId,
  size,
  onSelectEntity,
}) => {
  const mapboxToken = useUiStore((state) => state.mapboxToken)
  const scopedRealCameras = React.useMemo(
    () => getScopedRealCameras(scene, focusAreaId),
    [focusAreaId, scene],
  )
  const cameraByIncomingId = React.useMemo(
    () => getCameraByIncomingId(scopedRealCameras),
    [scopedRealCameras],
  )
  const scopedDeviceIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          scopedRealCameras
            .map((camera) => camera.sourceDeviceId)
            .filter((deviceId) => typeof deviceId === 'string' && deviceId),
        ),
      ),
    [scopedRealCameras],
  )
  const scopedDeviceIdsKey = React.useMemo(
    () => [...scopedDeviceIds].sort().join('|'),
    [scopedDeviceIds],
  )

  const defaultCameraState = React.useMemo(() => getDefaultCameraState(), [])
  const mapCenter = React.useMemo<GeoPoint>(() => {
    if (scene.editorMode !== 'map') {
      return [defaultCameraState.camera_lon, defaultCameraState.camera_lat]
    }

    return (
      getMapModeAreaCenter(scene, focusAreaId) ?? [
        defaultCameraState.camera_lon,
        defaultCameraState.camera_lat,
      ]
    )
  }, [
    defaultCameraState.camera_lat,
    defaultCameraState.camera_lon,
    focusAreaId,
    scene,
  ])

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const detectionOverlayRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const mapLoadedRef = React.useRef(false)
  const hasAutoFocusedRef = React.useRef(false)

  const cameraByIncomingIdRef = React.useRef(cameraByIncomingId)
  const defaultCameraStateRef = React.useRef(defaultCameraState)

  const cameraStatesRef = React.useRef(new Map<string, CameraState>())
  const cameraMarkersRef = React.useRef(new Map<string, mapboxgl.Marker>())
  const detectionStatesRef = React.useRef(new Map<string, DetectionState>())
  const detectionMarkersRef = React.useRef(new Map<string, HTMLDivElement>())

  const [selectedCamera, setSelectedCamera] =
    React.useState<CameraEntity | null>(null)

  const mapHeight = React.useMemo(
    () => Math.max(260, Math.round(size.height * 1.8)),
    [size.height],
  )

  const renderAllDetections = useCallbackRef(() => {
    const map = mapRef.current
    const overlay = detectionOverlayRef.current

    if (!map || !overlay) {
      return
    }

    detectionStatesRef.current.forEach((detectionState, detectionId) => {
      const point = map.project([detectionState.lon, detectionState.lat])
      const existing = detectionMarkersRef.current.get(detectionId)

      if (!existing) {
        return
      }

      existing.style.left = `${point.x}px`
      existing.style.top = `${point.y}px`
    })
  })

  const updateCameraDirection = useCallbackRef(updateCameraMarkerDirection)

  const openCameraVideo = useCallbackRef((cameraId: string) => {
    const camera = cameraByIncomingIdRef.current[cameraId]

    if (!camera) {
      return
    }

    onSelectEntity(camera.id)
    setSelectedCamera(camera)
  })

  const syncCameraMarkerInteractivity = useCallbackRef(
    (element: HTMLDivElement, cameraId: string) => {
      const camera = cameraByIncomingIdRef.current[cameraId]
      const hasVideo = Boolean(camera)

      updateCameraMarkerInteractivity({
        element,
        hasVideo,
        label: `Open ${camera?.sourceDeviceName || camera?.name || 'camera'} stream`,
        onOpen: () => {
          openCameraVideo(cameraId)
        },
      })
    },
  )

  const buildCameraMarkerElement = useCallbackRef((cameraId: string) => {
    const camera = cameraByIncomingIdRef.current[cameraId]
    return createCameraMarkerElement({
      cameraColor: cameraColorForId(cameraId),
      cameraLabel: camera?.sourceDeviceName ?? cameraId,
      interactivityLabel: `Open ${camera?.sourceDeviceName || camera?.name || 'camera'} stream`,
      hasVideo: Boolean(camera),
      onOpen: () => {
        openCameraVideo(cameraId)
      },
    })
  })

  const updateCameraFovs = useCallbackRef(() => {
    const map = mapRef.current

    if (!map || !mapLoadedRef.current) {
      return
    }

    const source = map.getSource(fovSourceId) as
      | mapboxgl.GeoJSONSource
      | undefined
    if (!source) {
      return
    }

    const features = buildCameraFovFeatures({
      cameraStates: Array.from(cameraStatesRef.current.entries()),
      defaultIntrinsics,
    })

    source.setData({
      type: 'FeatureCollection',
      features,
    })
  })

  const ensureCameraMarker = useCallbackRef(
    (cameraId: string, cameraState: CameraState) => {
      const map = mapRef.current

      if (!map) {
        return
      }

      const existingMarker = cameraMarkersRef.current.get(cameraId)
      if (existingMarker) {
        existingMarker.setLngLat([
          cameraState.camera_lon,
          cameraState.camera_lat,
        ])
        updateCameraDirection(existingMarker, cameraState.yaw_deg)
        syncCameraMarkerInteractivity(
          existingMarker.getElement() as HTMLDivElement,
          cameraId,
        )

        const label = existingMarker
          .getElement()
          .querySelector('.real-radar-camera-label') as HTMLDivElement | null

        if (label) {
          label.textContent =
            cameraByIncomingIdRef.current[cameraId]?.sourceDeviceName ??
            cameraId
        }

        return
      }

      const markerElement = buildCameraMarkerElement(cameraId)
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'bottom',
      })
        .setLngLat([cameraState.camera_lon, cameraState.camera_lat])
        .addTo(map)

      cameraMarkersRef.current.set(cameraId, marker)
      updateCameraDirection(marker, cameraState.yaw_deg)
    },
  )

  const upsertCamera = useCallbackRef(
    (cameraId: string, cameraState: CameraState) => {
      ensureCameraMarker(cameraId, cameraState)
      updateCameraFovs()
    },
  )

  const updateDetectionElement = useCallbackRef(
    (element: HTMLDivElement, detectionState: DetectionState) => {
      updateDetectionMarkerElement({element, detectionState})
    },
  )

  const ensureDetectionMarker = useCallbackRef(
    (detectionId: string, detectionState: DetectionState) => {
      const map = mapRef.current
      const overlay = detectionOverlayRef.current

      if (!map || !overlay) {
        return
      }

      const point = map.project([detectionState.lon, detectionState.lat])
      const existingElement = detectionMarkersRef.current.get(detectionId)

      if (existingElement) {
        existingElement.style.left = `${point.x}px`
        existingElement.style.top = `${point.y}px`
        updateDetectionElement(existingElement, detectionState)
        return
      }

      const element = document.createElement('div')
      element.className = 'real-radar-detection-marker'
      element.style.left = `${point.x}px`
      element.style.top = `${point.y}px`

      updateDetectionElement(element, detectionState)

      overlay.appendChild(element)
      detectionMarkersRef.current.set(detectionId, element)
    },
  )

  const removeDetectionMarker = useCallbackRef((detectionId: string) => {
    const marker = detectionMarkersRef.current.get(detectionId)
    if (marker) {
      marker.remove()
      detectionMarkersRef.current.delete(detectionId)
    }
  })

  const focusOnCamera = useCallbackRef((cameraState: CameraState) => {
    const map = mapRef.current

    if (!map) {
      return
    }

    map.easeTo({
      center: [cameraState.camera_lon, cameraState.camera_lat],
      zoom: 16,
      duration: 800,
    })
  })

  const {clearRuntime, radarUpdateItems} = useRealRadarRuntime({
    cameraStatesRef,
    detectionStatesRef,
    defaultCameraStateRef,
    defaultIntrinsics,
    deviceIds: scopedDeviceIds,
    onCameraUpsert: (cameraId, cameraState) => {
      upsertCamera(cameraId, cameraState)

      if (!hasAutoFocusedRef.current && mapLoadedRef.current) {
        focusOnCamera(cameraState)
        hasAutoFocusedRef.current = true
      }
    },
    onDetectionUpsert: (detectionId, detectionState) => {
      ensureDetectionMarker(detectionId, detectionState)
    },
    onDetectionRemove: removeDetectionMarker,
  })

  React.useEffect(() => {
    cameraByIncomingIdRef.current = cameraByIncomingId
    defaultCameraStateRef.current = defaultCameraState

    cameraMarkersRef.current.forEach((marker, cameraId) => {
      syncCameraMarkerInteractivity(
        marker.getElement() as HTMLDivElement,
        cameraId,
      )
      const label = marker
        .getElement()
        .querySelector('.real-radar-camera-label') as HTMLDivElement | null

      if (label) {
        label.textContent =
          cameraByIncomingId[cameraId]?.sourceDeviceName ?? cameraId
      }
    })
  }, [cameraByIncomingId, defaultCameraState, syncCameraMarkerInteractivity])

  React.useEffect(() => {
    clearRuntime()

    cameraMarkersRef.current.forEach((marker) => {
      marker.remove()
    })
    cameraMarkersRef.current.clear()

    detectionMarkersRef.current.forEach((marker) => {
      marker.remove()
    })
    detectionMarkersRef.current.clear()

    hasAutoFocusedRef.current = false

    updateCameraFovs()
  }, [clearRuntime, scopedDeviceIdsKey, updateCameraFovs])

  React.useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = mapboxToken
    mapContainerRef.current.innerHTML = ''

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: 15,
      pitch: 45,
      bearing: 0,
      antialias: true,
    })

    mapRef.current = map

    const handleMove = () => {
      renderAllDetections()
    }

    map.on('move', handleMove)
    map.on('zoom', handleMove)
    map.on('pitch', handleMove)
    map.on('rotate', handleMove)

    map.addControl(
      new mapboxgl.NavigationControl({visualizePitch: true}),
      'top-right',
    )

    map.on('load', () => {
      mapLoadedRef.current = true

      map.addSource(fovSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      map.addLayer({
        id: `${fovSourceId}-fill`,
        type: 'fill',
        source: fovSourceId,
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#22d3ee'],
          'fill-opacity': 0.18,
        },
      })

      map.addLayer({
        id: `${fovSourceId}-outline`,
        type: 'line',
        source: fovSourceId,
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#22d3ee'],
          'line-width': 2,
          'line-dasharray': [1.5, 1],
        },
      })

      updateCameraFovs()
    })

    const cameraMarkers = cameraMarkersRef.current
    const detectionMarkers = detectionMarkersRef.current

    return () => {
      map.off('move', handleMove)
      map.off('zoom', handleMove)
      map.off('pitch', handleMove)
      map.off('rotate', handleMove)

      cameraMarkers.forEach((marker) => {
        marker.remove()
      })
      cameraMarkers.clear()

      detectionMarkers.forEach((marker) => {
        marker.remove()
      })
      detectionMarkers.clear()

      mapLoadedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [mapCenter, mapboxToken, renderAllDetections, updateCameraFovs])

  React.useEffect(() => {
    if (scene.editorMode !== 'map') {
      return
    }

    const map = mapRef.current
    if (!map || !mapLoadedRef.current) {
      return
    }

    map.easeTo({
      center: mapCenter,
      duration: 600,
    })
  }, [mapCenter, scene.editorMode])

  return (
    <>
      <div className='vs:flex vs:min-h-0 vs:flex-1 vs:flex-col vs:gap-2 vs:p-3'>
        <div
          className='real-radar-map-frame'
          style={{height: `${mapHeight}px`}}
        >
          {mapboxToken ? (
            <div className='real-radar-map-container' ref={mapContainerRef} />
          ) : (
            <div className='real-radar-map-placeholder'>
              <p>
                Add your Mapbox token via `mapboxToken` prop or
                `VITE_MAPBOX_TOKEN`.
              </p>
            </div>
          )}

          <div
            className='real-radar-detection-overlay'
            ref={detectionOverlayRef}
          />

          <div className='real-radar-map-hint'>
            Area devices: {scopedDeviceIds.length} | Live trackers:{' '}
            {radarUpdateItems.length}
          </div>
        </div>

        <div aria-hidden='true' className='vs:hidden'>
          <SimulationRealRadarActivities activities={radarUpdateItems} />
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCamera(null)
          }
        }}
        open={Boolean(selectedCamera)}
      >
        <DialogContent className='vs:max-h-[85dvh] vs:overflow-hidden vs:p-0 vs:sm:max-w-[900px]'>
          <DialogHeader className='vs:px-4 vs:pt-4'>
            <DialogTitle>
              {selectedCamera?.sourceDeviceName ??
                selectedCamera?.name ??
                'Camera stream'}
            </DialogTitle>
          </DialogHeader>
          <div className='vs:h-[540px]'>
            {selectedCamera ? (
              <RealDeviceFeedPlayer
                camera={selectedCamera}
                allowFullscreen={false}
                autoPlay
                showControls
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
