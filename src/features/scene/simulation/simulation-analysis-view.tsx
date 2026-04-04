import type {MapRef} from 'react-map-gl/mapbox'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  PreviewViewMode,
  SceneRoot,
} from '@/features/scene/types/types'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'
import {MapView} from '@/features/scene/map'
import {
  createSnapshotFilename,
  downloadDataUrl,
} from '@/features/scene/utils/scene-export'
import {cn} from '@/lib/utils'

import type {SimulationCaptureApi} from './simulation-capture'

import {loadSimulationCanvasModule} from './simulation-canvas-loader'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'
import {SimulationTopBar} from './simulation-top-bar'
import {SimulationViewport} from './simulation-viewport'
import {useCameraFeedTargets} from './use-camera-feed-targets'
import {useSimulationRecording} from './use-simulation-recording'

interface SimulationAnalysisViewProps {
  showTopBar?: boolean
  showAuxiliaryPanels?: boolean
  allowBackToEditor?: boolean
  allowPreviewViewSwitch?: boolean
  hideAreaSelection?: boolean
  onBackToEditor: () => void
}

const EMPTY_PEOPLE_WORLD: Record<
  string,
  {x: number; y: number; z: number; height: number}
> = {}

const LazySimulationCanvas = React.lazy(async () => {
  const module = await loadSimulationCanvasModule()
  return {default: module.SimulationCanvas}
})

const LazySimulationRadar = React.lazy(async () => {
  const module = await import('./simulation-radar')
  return {default: module.SimulationRadar}
})

const LazySimulationCameraSidebar = React.lazy(async () => {
  const module = await import('./simulation-camera-sidebar')
  return {default: module.SimulationCameraSidebar}
})

const SidePanelLoading: React.FC = () => (
  <div className='vs:flex vs:flex-col vs:gap-4 vs:p-4 vs:text-sm'>
    <div className='vs:h-44 vs:w-full vs:rounded-lg vs:bg-muted/60 vs:animate-pulse' />
    <div className='vs:h-56 vs:w-full vs:rounded-lg vs:bg-muted/60 vs:animate-pulse' />
  </div>
)

interface ShowSimulationSidePanelsInput {
  showAuxiliaryPanels: boolean
  hasCameraFeedTiles: boolean
  previewViewMode: PreviewViewMode
  hasCamerasInActiveArea: boolean
}

interface PreviewPendingOverlayProps {
  label: string
}

const PreviewPendingOverlay: React.FC<PreviewPendingOverlayProps> = ({
  label,
}) => (
  <div className='vs:pointer-events-none vs:absolute vs:inset-0 vs:z-30 vs:flex vs:items-center vs:justify-center vs:bg-background/70 vs:backdrop-blur-sm'>
    <div className='vs:flex vs:items-center vs:gap-2 vs:rounded-md vs:border vs:bg-background vs:px-3 vs:py-2 vs:text-sm vs:font-medium vs:shadow-sm'>
      <span className='vs:inline-flex vs:size-4 vs:animate-spin vs:rounded-full vs:border-2 vs:border-current vs:border-t-transparent vs:shrink-0' />
      <span>{label}</span>
    </div>
  </div>
)

const scheduleMapResize = (mapRef: MapRef | null) => {
  const map = mapRef?.getMap?.()
  if (!map) {
    return undefined
  }

  let frameId = 0
  let trailingFrameId = 0

  frameId = window.requestAnimationFrame(() => {
    map.resize()
    trailingFrameId = window.requestAnimationFrame(() => {
      map.resize()
    })
  })

  return () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId)
    }
    if (trailingFrameId) {
      window.cancelAnimationFrame(trailingFrameId)
    }
  }
}

const showSimulationSidePanelsForMode = ({
  showAuxiliaryPanels,
  hasCameraFeedTiles,
  previewViewMode,
  hasCamerasInActiveArea,
}: ShowSimulationSidePanelsInput) => {
  if (!showAuxiliaryPanels || !hasCameraFeedTiles) {
    return false
  }
  if (previewViewMode !== '2d') {
    return true
  }
  return hasCamerasInActiveArea
}

interface PreviewViewportControlsProps {
  allowPreviewViewSwitch: boolean
  hideAreaSelection: boolean
  previewViewMode: PreviewViewMode
  activeAreaId?: string
  areas: AreaEntity[]
  onPreviewViewModeChange: (mode: PreviewViewMode) => void
  onActiveAreaChange: (areaId: string) => void
}

const getFramedSceneForPreview = (
  scene: SceneRoot,
  focusAreaId?: string,
): SceneRoot => {
  if (!focusAreaId) {
    return scene
  }
  return {
    ...scene,
    areas: scene.areas.filter((area) => area.id === focusAreaId),
    walls: scene.walls.filter((wall) => wall.areaId === focusAreaId),
    shapes: scene.shapes.filter((shape) => shape.areaId === focusAreaId),
    cameras: scene.cameras.filter((camera) => camera.areaId === focusAreaId),
    people: scene.people.filter((person) => person.areaId === focusAreaId),
  }
}

const PreviewViewportControls: React.FC<PreviewViewportControlsProps> = ({
  allowPreviewViewSwitch,
  hideAreaSelection,
  previewViewMode,
  activeAreaId,
  areas,
  onPreviewViewModeChange,
  onActiveAreaChange,
}) => {
  const showAreaSelection = !hideAreaSelection && areas.length > 0

  if (!allowPreviewViewSwitch && !showAreaSelection) {
    return null
  }

  return (
    <div className='vs:flex vs:items-center vs:gap-2'>
      {allowPreviewViewSwitch ? (
        <ToggleGroup
          className='vs:bg-background'
          type='single'
          value={previewViewMode}
          variant='outline'
          onValueChange={(value) => {
            if (value === '3d' || value === '2d') {
              onPreviewViewModeChange(value)
            }
          }}
        >
          <ToggleGroupItem
            aria-label='3D view'
            className='vs:cursor-pointer'
            value='3d'
          >
            3D
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label='2D top-down view'
            className='vs:cursor-pointer'
            value='2d'
          >
            2D
          </ToggleGroupItem>
        </ToggleGroup>
      ) : null}
      {showAreaSelection ? (
        <Select value={activeAreaId} onValueChange={onActiveAreaChange}>
          <SelectTrigger
            className='vs:bg-background! vs:min-w-40'
            disabled={areas.length <= 1}
          >
            <SelectValue placeholder='Select area' />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}

/* eslint-disable complexity */
// eslint-disable-next-line max-lines-per-function, max-statements
export const SimulationAnalysisView: React.FC<SimulationAnalysisViewProps> = ({
  showTopBar = true,
  showAuxiliaryPanels = true,
  allowBackToEditor = true,
  allowPreviewViewSwitch = true,
  hideAreaSelection = false,
  onBackToEditor,
}) => {
  const scene = useSceneStore((state) => state.scene)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const previewViewMode = useUiStore((state) => state.previewViewMode)
  const previewPeopleWorld = useUiStore(
    React.useCallback(
      (state) =>
        previewViewMode === '2d'
          ? state.visionState.peopleWorld
          : EMPTY_PEOPLE_WORLD,
      [previewViewMode],
    ),
  )
  const setPreviewViewMode = useUiStore((state) => state.setPreviewViewMode)
  const activePreviewAreaId = React.useMemo(
    () => scene.activeAreaId ?? scene.areas[0]?.id,
    [scene.activeAreaId, scene.areas],
  )
  const framedScene = React.useMemo(
    () => getFramedSceneForPreview(scene, activePreviewAreaId),
    [activePreviewAreaId, scene],
  )
  const originPoint = React.useMemo(
    () => computeSceneOrigin(framedScene),
    [framedScene],
  )
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const captureRef = React.useRef<SimulationCaptureApi | null>(null)
  const simulationCaptureRef = React.useRef<SimulationCaptureApi | null>(null)
  const [previewMapRef, setPreviewMapRef] = React.useState<MapRef | null>(null)
  const [isSimulationCanvasReady, setSimulationCanvasReady] =
    React.useState(false)
  const [isPreviewMapReady, setPreviewMapReady] = React.useState(false)
  const handleCaptureReady = useCallbackRef((api: SimulationCaptureApi) => {
    simulationCaptureRef.current = api
    setSimulationCanvasReady(true)
    if (previewViewMode === '3d') {
      captureRef.current = api
    }
  })
  const handlePreviewMapReady = useCallbackRef((nextMap: MapRef | null) => {
    setPreviewMapRef(nextMap)
    setPreviewMapReady(Boolean(nextMap))
  })

  const {
    isRecording,
    formattedTime,
    fps,
    isLowFps,
    startRecording,
    stopRecording,
  } = useSimulationRecording({captureRef})
  const radarPanelSize = {width: 360, height: 180}

  const visibleCameras = React.useMemo(
    () =>
      activePreviewAreaId
        ? scene.cameras.filter(
            (camera) => camera.areaId === activePreviewAreaId,
          )
        : scene.cameras,
    [activePreviewAreaId, scene.cameras],
  )
  const feedTargets = useCameraFeedTargets({cameras: visibleCameras})
  const hasCamerasInActiveArea = visibleCameras.length > 0
  const hasCameraFeedTiles = feedTargets.length > 0
  const showSimulationSidePanels = showSimulationSidePanelsForMode({
    showAuxiliaryPanels,
    hasCameraFeedTiles,
    previewViewMode,
    hasCamerasInActiveArea,
  })
  const simulatedPreviewPeople = React.useMemo(() => {
    if (previewViewMode !== '2d') {
      return scene.people
    }
    return scene.people.map((person) => {
      const world = previewPeopleWorld[person.id]
      if (!world) {
        return person
      }
      const [lng, lat] = transformer.toGeoPoint({x: world.x, z: world.z})
      return {
        ...person,
        x: lng,
        y: lat,
      }
    })
  }, [previewPeopleWorld, previewViewMode, scene.people, transformer])

  const handleSelectEntity = useCallbackRef((id?: string) => {
    setSelection(id ? [id] : [])
  })
  const handleActiveAreaChange = useCallbackRef((areaId: string) => {
    setActiveArea(areaId)
  })

  const [flashActive, setFlashActive] = React.useState(false)
  const flashTimeoutRef = React.useRef<number | null>(null)

  const triggerFlash = useCallbackRef(() => {
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current)
    }
    setFlashActive(true)
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashActive(false)
      flashTimeoutRef.current = null
    }, 100)
  })

  const handleSnapshot = useCallbackRef(() => {
    const captureApi = captureRef.current
    if (!captureApi) {
      toast.error('Snapshot unavailable: preview view not ready')
      return
    }
    const dataUrl = captureApi.captureFrame(2)
    if (!dataUrl) {
      toast.error('Snapshot failed')
      return
    }
    downloadDataUrl(dataUrl, createSnapshotFilename())
    triggerFlash()
    toast.success('Snapshot saved')
  })

  const handleBackAction = useCallbackRef(() => {
    if (!allowBackToEditor) {
      return
    }

    onBackToEditor()
  })
  const handlePreviewViewModeChange = useCallbackRef(
    (mode: PreviewViewMode) => {
      if (!allowPreviewViewSwitch) {
        return
      }
      setPreviewViewMode(mode)
    },
  )
  const previewViewportControls = (
    <PreviewViewportControls
      activeAreaId={activePreviewAreaId}
      areas={scene.areas}
      allowPreviewViewSwitch={allowPreviewViewSwitch}
      hideAreaSelection={hideAreaSelection}
      onActiveAreaChange={handleActiveAreaChange}
      onPreviewViewModeChange={handlePreviewViewModeChange}
      previewViewMode={previewViewMode}
    />
  )
  const showPreviewViewportControls =
    allowPreviewViewSwitch || (!hideAreaSelection && scene.areas.length > 0)
  const isPreviewSurfacePending =
    previewViewMode === '3d' ? !isSimulationCanvasReady : !isPreviewMapReady
  const previewSurfacePendingLabel =
    previewViewMode === '3d' ? 'Preparing 3D preview' : 'Preparing 2D preview'

  React.useEffect(() => {
    if (previewViewMode === '2d') {
      const map = previewMapRef?.getMap?.()
      if (!map) {
        return
      }
      captureRef.current = {
        getCanvas: () => map.getCanvas(),
        captureFrame: () => {
          try {
            return map.getCanvas().toDataURL('image/png')
          } catch {
            return null
          }
        },
      }
      return
    }

    captureRef.current = simulationCaptureRef.current
  }, [previewMapRef, previewViewMode])
  React.useEffect(() => {
    if (previewViewMode !== '2d') {
      return
    }
    return scheduleMapResize(previewMapRef)
  }, [previewMapRef, previewViewMode, showSimulationSidePanels])

  React.useEffect(
    () => () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current)
      }
    },
    [],
  )
  React.useEffect(() => {
    if (!scene.activeAreaId && scene.areas[0]) {
      setActiveArea(scene.areas[0].id)
    }
  }, [scene.activeAreaId, scene.areas, setActiveArea])

  return (
    <div className='vs:flex vs:h-full vs:min-h-0 vs:min-w-0 vs:flex-1 vs:flex-col vs:overflow-hidden vs:overscroll-none'>
      {showTopBar ? (
        <SimulationTopBar
          allowPreviewViewSwitch={allowPreviewViewSwitch}
          isRecording={isRecording}
          leftControls={
            showPreviewViewportControls ? previewViewportControls : null
          }
          onBackToEditor={handleBackAction}
          onPreviewViewModeChange={handlePreviewViewModeChange}
          onSnapshot={handleSnapshot}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          previewViewMode={previewViewMode}
          recordingLabel={`REC ${formattedTime}`}
          showBackButton={allowBackToEditor}
        />
      ) : null}

      <div className='vs:flex vs:flex-1 vs:min-h-0 vs:min-w-0 vs:overflow-hidden'>
        <SimulationViewport
          fps={fps}
          isLowFps={isLowFps}
          isRecording={isRecording}
          overlayControls={
            !showTopBar && showPreviewViewportControls ? (
              <div className='vs:pointer-events-none vs:absolute vs:left-4 vs:top-4 vs:z-20'>
                <div className='vs:pointer-events-auto'>
                  {previewViewportControls}
                </div>
              </div>
            ) : null
          }
          recordingLabel={`REC ${formattedTime}`}
          showFlash={flashActive}
        >
          <React.Suspense
            fallback={<PreviewPendingOverlay label='Loading 3D renderer' />}
          >
            <LazySimulationCanvas
              cameraFeedTargets={feedTargets}
              scene={scene}
              selectedEntityIds={selectedEntityIds}
              editorMode={scene.editorMode}
              focusAreaId={activePreviewAreaId}
              onCaptureReady={handleCaptureReady}
              onSelectEntity={handleSelectEntity}
              previewViewMode={previewViewMode}
              showMapTexture={scene.editorMode === 'map' && scene.mapVisible}
              className={cn(
                'vs:h-full vs:w-full',
                previewViewMode === '2d'
                  ? 'vs:pointer-events-none vs:opacity-0'
                  : 'vs:opacity-100',
              )}
            />
          </React.Suspense>
          {previewViewMode === '2d' ? (
            <div className='vs:absolute vs:inset-0 vs:z-10'>
              <MapView
                activeTool='hand'
                onMapReady={handlePreviewMapReady}
                peopleOverride={simulatedPreviewPeople}
                shapeMode='rectangle'
              />
            </div>
          ) : null}
          {isPreviewSurfacePending ? (
            <PreviewPendingOverlay label={previewSurfacePendingLabel} />
          ) : null}
        </SimulationViewport>
        {showSimulationSidePanels ? (
          <div className='vs:flex vs:h-full vs:min-h-0 vs:w-[360px] vs:max-w-[360px] vs:shrink-0 vs:flex-col vs:gap-4 vs:overflow-x-hidden vs:overflow-y-auto vs:overscroll-contain vs:border-l'>
            <React.Suspense fallback={<SidePanelLoading />}>
              <LazySimulationRadar
                size={radarPanelSize}
                scene={scene}
                selectedEntityIds={selectedEntityIds}
                focusAreaId={activePreviewAreaId}
                onSelectEntity={handleSelectEntity}
              />
              <LazySimulationCameraSidebar
                feedTargets={feedTargets}
                scene={scene}
                focusAreaId={activePreviewAreaId}
              />
            </React.Suspense>
          </div>
        ) : null}
      </div>
    </div>
  )
}
/* eslint-enable complexity */
