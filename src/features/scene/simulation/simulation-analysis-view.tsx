import type {MapRef} from 'react-map-gl/mapbox'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import type {
  AreaEntity,
  PreviewViewMode,
  SimulationViewMode,
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
import {useElementSize} from './camera-feed-utils'
import {useCameraFeedTargets} from './use-camera-feed-targets'
import {useSimulationRecording} from './use-simulation-recording'

interface SimulationAnalysisViewProps {
  showTopBar?: boolean
  showAuxiliaryPanels?: boolean
  allowBackToEditor?: boolean
  allowPreviewViewSwitch?: boolean
  allowSimulationCameraGrid?: boolean
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

const LazySimulationCameraGridView = React.lazy(async () => {
  const module = await import('./simulation-camera-grid-view')
  return {default: module.SimulationCameraGridView}
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
  simulationViewMode: SimulationViewMode
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
  simulationViewMode,
  hasCamerasInActiveArea,
}: ShowSimulationSidePanelsInput) => {
  if (simulationViewMode === 'cameraGrid') {
    return false
  }
  if (!showAuxiliaryPanels || !hasCameraFeedTiles) {
    return false
  }
  if (previewViewMode !== '2d') {
    return true
  }
  return hasCamerasInActiveArea
}

interface SimulationViewportControlsProps {
  allowPreviewViewSwitch: boolean
  allowSimulationCameraGrid: boolean
  hideAreaSelection: boolean
  previewViewMode: PreviewViewMode
  simulationViewMode: SimulationViewMode
  gridSize: number
  activeAreaId?: string
  areas: AreaEntity[]
  onPreviewViewModeChange: (mode: PreviewViewMode) => void
  onSimulationViewModeChange: (mode: SimulationViewMode) => void
  onGridSizeChange: (gridSize: number) => void
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

const SimulationViewportControls: React.FC<SimulationViewportControlsProps> = ({
  allowPreviewViewSwitch,
  allowSimulationCameraGrid,
  hideAreaSelection,
  previewViewMode,
  simulationViewMode,
  gridSize,
  activeAreaId,
  areas,
  onPreviewViewModeChange,
  onSimulationViewModeChange,
  onGridSizeChange,
  onActiveAreaChange,
}) => {
  const showAreaSelection = !hideAreaSelection && areas.length > 0

  if (
    !allowPreviewViewSwitch &&
    !allowSimulationCameraGrid &&
    !showAreaSelection
  ) {
    return null
  }

  return (
    <div className='vs:flex vs:flex-wrap vs:items-center vs:gap-2'>
      {allowSimulationCameraGrid ? (
        <ToggleGroup
          className='vs:bg-background'
          type='single'
          value={simulationViewMode}
          variant='outline'
          onValueChange={(value) => {
            if (value === 'scene' || value === 'cameraGrid') {
              onSimulationViewModeChange(value)
            }
          }}
        >
          <ToggleGroupItem
            aria-label='Scene view'
            className='vs:cursor-pointer'
            value='scene'
          >
            Scene
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label='Camera grid view'
            className='vs:cursor-pointer'
            value='cameraGrid'
          >
            Grid
          </ToggleGroupItem>
        </ToggleGroup>
      ) : null}
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
      {allowSimulationCameraGrid && simulationViewMode === 'cameraGrid' ? (
        <ToggleGroup
          className='vs:bg-background'
          type='single'
          value={`${gridSize}`}
          variant='outline'
          onValueChange={(value) => {
            const next = Number.parseInt(value, 10)
            if (next === 2 || next === 3 || next === 4) {
              onGridSizeChange(next)
            }
          }}
        >
          <ToggleGroupItem
            aria-label='2 by 2 grid'
            className='vs:cursor-pointer'
            value='2'
          >
            2x2
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label='3 by 3 grid'
            className='vs:cursor-pointer'
            value='3'
          >
            3x3
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label='4 by 4 grid'
            className='vs:cursor-pointer'
            value='4'
          >
            4x4
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
  allowSimulationCameraGrid = true,
  hideAreaSelection = false,
  onBackToEditor,
}) => {
  const scene = useSceneStore((state) => state.scene)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const previewViewMode = useUiStore((state) => state.previewViewMode)
  const simulationViewMode = useUiStore((state) => state.simulationViewMode)
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
  const setSimulationViewMode = useUiStore(
    (state) => state.setSimulationViewMode,
  )
  const activePreviewAreaId = React.useMemo(
    () => scene.activeAreaId ?? scene.areas[0]?.id,
    [scene.activeAreaId, scene.areas],
  )
  const [cameraGridSize, setCameraGridSize] = React.useState(2)
  const isCameraGridView = simulationViewMode === 'cameraGrid'
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
  const [sidebarWidth, setSidebarWidth] = React.useState(360)
  const layoutRef = React.useRef<HTMLDivElement | null>(null)
  const layoutSize = useElementSize(layoutRef)
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
  const radarPanelSize = React.useMemo(
    () => ({width: Math.round(sidebarWidth), height: 180}),
    [sidebarWidth],
  )
  const minSidebarWidth = 360
  const maxSidebarWidth = Math.max(minSidebarWidth, layoutSize.width * 0.6)

  const visibleCameras = React.useMemo(
    () =>
      activePreviewAreaId
        ? scene.cameras.filter(
            (camera) => camera.areaId === activePreviewAreaId,
          )
        : scene.cameras,
    [activePreviewAreaId, scene.cameras],
  )
  const sidebarColumnCount = React.useMemo(() => {
    const width = sidebarWidth
    if (width >= 900) {
      return 3
    }
    if (width >= 560) {
      return 2
    }
    return 1
  }, [sidebarWidth])
  const maxFeedTargets = React.useMemo(() => {
    const desired = sidebarColumnCount * 4
    return Math.min(12, Math.max(6, desired))
  }, [sidebarColumnCount])
  const feedTargets = useCameraFeedTargets({
    cameras: visibleCameras,
    maxFeeds: maxFeedTargets,
  })
  const hasCamerasInActiveArea = visibleCameras.length > 0
  const hasCameraFeedTiles = feedTargets.length > 0
  const showSimulationSidePanels = showSimulationSidePanelsForMode({
    showAuxiliaryPanels,
    hasCameraFeedTiles,
    previewViewMode,
    simulationViewMode,
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
    if (isCameraGridView) {
      setSimulationViewMode('scene')
      return
    }
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
  const handleSidebarResizeStart = useCallbackRef(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!layoutRef.current) {
        return
      }
      event.preventDefault()
      const layoutRect = layoutRef.current.getBoundingClientRect()
      const minWidth = minSidebarWidth
      const maxWidth = Math.max(minWidth, layoutRect.width * 0.6)
      const previousUserSelect = document.body.style.userSelect
      const previousCursor = document.body.style.cursor
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.min(
          Math.max(layoutRect.right - moveEvent.clientX, minWidth),
          maxWidth,
        )
        setSidebarWidth(nextWidth)
      }

      const handlePointerUp = () => {
        document.body.style.userSelect = previousUserSelect
        document.body.style.cursor = previousCursor
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
  )
  const handleSimulationViewModeChange = useCallbackRef(
    (mode: SimulationViewMode) => {
      if (!allowSimulationCameraGrid && mode === 'cameraGrid') {
        return
      }
      setSimulationViewMode(mode)
    },
  )
  const handleCameraGridSizeChange = useCallbackRef((size: number) => {
    setCameraGridSize(size)
  })
  const previewViewportControls = (
    <SimulationViewportControls
      activeAreaId={activePreviewAreaId}
      areas={scene.areas}
      allowPreviewViewSwitch={allowPreviewViewSwitch}
      allowSimulationCameraGrid={allowSimulationCameraGrid}
      gridSize={cameraGridSize}
      hideAreaSelection={hideAreaSelection}
      onActiveAreaChange={handleActiveAreaChange}
      onGridSizeChange={handleCameraGridSizeChange}
      onPreviewViewModeChange={handlePreviewViewModeChange}
      onSimulationViewModeChange={handleSimulationViewModeChange}
      previewViewMode={previewViewMode}
      simulationViewMode={simulationViewMode}
    />
  )
  const gridViewportControls = allowSimulationCameraGrid ? (
    <ToggleGroup
      className='vs:bg-background'
      type='single'
      value={`${cameraGridSize}`}
      variant='outline'
      onValueChange={(value) => {
        const next = Number.parseInt(value, 10)
        if (next === 2 || next === 3 || next === 4) {
          setCameraGridSize(next)
        }
      }}
    >
      <ToggleGroupItem
        aria-label='2 by 2 grid'
        className='vs:cursor-pointer'
        value='2'
      >
        2x2
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label='3 by 3 grid'
        className='vs:cursor-pointer'
        value='3'
      >
        3x3
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label='4 by 4 grid'
        className='vs:cursor-pointer'
        value='4'
      >
        4x4
      </ToggleGroupItem>
    </ToggleGroup>
  ) : null
  const gridMaxHeight = showTopBar ? 'calc(100vh - 56px)' : '100vh'
  const showPreviewViewportControls =
    allowPreviewViewSwitch ||
    allowSimulationCameraGrid ||
    (!hideAreaSelection && scene.areas.length > 0)
  const showViewportControls = showPreviewViewportControls && !isCameraGridView
  const showGridViewportControls = isCameraGridView && allowSimulationCameraGrid
  const isPreviewSurfacePending = isCameraGridView
    ? !isSimulationCanvasReady
    : previewViewMode === '3d'
      ? !isSimulationCanvasReady
      : !isPreviewMapReady
  const previewSurfacePendingLabel = isCameraGridView
    ? 'Preparing camera grid'
    : previewViewMode === '3d'
      ? 'Preparing 3D preview'
      : 'Preparing 2D preview'

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
    if (previewViewMode !== '2d' || simulationViewMode !== 'scene') {
      return
    }
    return scheduleMapResize(previewMapRef)
  }, [previewMapRef, previewViewMode, showSimulationSidePanels, simulationViewMode])

  React.useEffect(() => {
    if (!layoutSize.width) {
      return
    }
    if (sidebarWidth > maxSidebarWidth) {
      setSidebarWidth(maxSidebarWidth)
    }
  }, [layoutSize.width, maxSidebarWidth, sidebarWidth])

  React.useEffect(() => {
    if (allowSimulationCameraGrid) {
      return
    }
    if (simulationViewMode !== 'cameraGrid') {
      return
    }
    setSimulationViewMode('scene')
  }, [allowSimulationCameraGrid, setSimulationViewMode, simulationViewMode])

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
          allowPreviewViewSwitch={allowPreviewViewSwitch && !isCameraGridView}
          isRecording={isRecording}
          leftControls={
            showGridViewportControls
              ? gridViewportControls
              : showViewportControls
                ? previewViewportControls
                : null
          }
          onBackToEditor={handleBackAction}
          onPreviewViewModeChange={handlePreviewViewModeChange}
          onSnapshot={handleSnapshot}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          previewViewMode={previewViewMode}
          recordingLabel={`REC ${formattedTime}`}
          showRecordingControl={!isCameraGridView || isRecording}
          showSnapshotControl={!isCameraGridView}
          showBackButton={allowBackToEditor}
        />
      ) : null}

      <div
        ref={layoutRef}
        className='vs:flex vs:flex-1 vs:min-h-0 vs:min-w-0 vs:overflow-hidden'
      >
        <SimulationViewport
          fps={fps}
          isLowFps={isLowFps}
          isRecording={isRecording}
          overlayControls={
            !showTopBar && showViewportControls ? (
              <div className='vs:pointer-events-none vs:absolute vs:left-4 vs:top-4 vs:z-20'>
                <div className='vs:pointer-events-auto'>
                  {previewViewportControls}
                </div>
              </div>
            ) : !showTopBar && showGridViewportControls ? (
              <div className='vs:pointer-events-none vs:absolute vs:left-4 vs:top-4 vs:z-20'>
                <div className='vs:pointer-events-auto'>
                  {gridViewportControls}
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
                previewViewMode === '2d' || isCameraGridView
                  ? 'vs:pointer-events-none vs:opacity-0'
                  : 'vs:opacity-100',
              )}
            />
          </React.Suspense>
          {previewViewMode === '2d' && !isCameraGridView ? (
            <div className='vs:absolute vs:inset-0 vs:z-10'>
              <MapView
                activeTool='hand'
                onMapReady={handlePreviewMapReady}
                peopleOverride={simulatedPreviewPeople}
                shapeMode='rectangle'
              />
            </div>
          ) : null}
          {isCameraGridView ? (
            <div className='vs:absolute vs:inset-0 vs:z-10'>
              <React.Suspense
                fallback={<PreviewPendingOverlay label='Loading camera grid' />}
              >
                <LazySimulationCameraGridView
                  focusAreaId={activePreviewAreaId}
                  feedTargets={feedTargets}
                  gridSize={cameraGridSize}
                  maxHeight={gridMaxHeight}
                  scene={scene}
                />
              </React.Suspense>
            </div>
          ) : null}
          {isPreviewSurfacePending ? (
            <PreviewPendingOverlay label={previewSurfacePendingLabel} />
          ) : null}
        </SimulationViewport>
        {showSimulationSidePanels ? (
          <>
            <div
              className='vs:w-2 vs:cursor-col-resize vs:bg-border/60 hover:vs:bg-border vs:transition-colors'
              onPointerDown={handleSidebarResizeStart}
            />
            <div
              className='vs:flex vs:h-full vs:min-h-0 vs:min-w-[360px] vs:shrink-0 vs:flex-col vs:gap-4 vs:overflow-x-hidden vs:overflow-y-auto vs:overscroll-contain'
              style={{width: sidebarWidth}}
            >
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
                  columnCount={sidebarColumnCount}
                />
              </React.Suspense>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
/* eslint-enable complexity */
