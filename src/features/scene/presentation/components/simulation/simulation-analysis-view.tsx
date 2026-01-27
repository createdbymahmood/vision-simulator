import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import type {SceneEntity, SceneMode} from '@/features/scene/domain/types'

import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {
  createSnapshotFilename,
  downloadDataUrl,
} from '@/features/scene/presentation/utils/scene-export'

import type {SimulationCaptureApi} from './simulation-capture'
import {SimulationCameraSidebar} from './simulation-camera-sidebar'
import {SimulationCanvas} from './simulation-canvas'
import {SimulationRadar} from './simulation-radar'
import {
  SimulationTopBar,
  type SimulationAreaOption,
} from './simulation-top-bar'
import {SimulationViewport} from './simulation-viewport'
import {useCameraFeedTargets} from './use-camera-feed-targets'
import {useSimulationRecording} from './use-simulation-recording'

const formatAreaLabel = (name: string, count: number) =>
  `${name} (${count} objects)`

// eslint-disable-next-line max-lines-per-function
export const SimulationAnalysisView: React.FC = () => {
  const scene = useSceneStore((state) => state.scene)
  const setSceneMode = useSceneStore((state) => state.setMode)
  const setMapVisibility = useSceneStore((state) => state.setMapVisibility)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

  const setViewMode = useUiStore((state) => state.setViewMode)

  const captureRef = React.useRef<SimulationCaptureApi | null>(null)
  const handleCaptureReady = useCallbackRef((api: SimulationCaptureApi) => {
    captureRef.current = api
  })

  const {
    isRecording,
    formattedTime,
    fps,
    isLowFps,
    startRecording,
    stopRecording,
  } = useSimulationRecording({captureRef})

  const areaOptions: SimulationAreaOption[] = React.useMemo(() => {
    const getCount = (areaId: string) =>
      [
        ...scene.walls,
        ...scene.shapes,
        ...scene.cameras,
        ...scene.people,
      ].filter(
        (entity: SceneEntity) => 'areaId' in entity && entity.areaId === areaId,
      ).length

    return scene.areas.map((area) => ({
      id: area.id,
      label: formatAreaLabel(area.name, getCount(area.id)),
      objects: getCount(area.id),
    }))
  }, [scene.cameras, scene.people, scene.shapes, scene.walls, scene.areas])

  const activeAreaId = scene.activeAreaId ?? 'all'
  const radarPanelSize = {width: 360, height: 180}

  const feedTargets = useCameraFeedTargets({cameras: scene.cameras})

  const handleAreaChange = useCallbackRef((value: string) => {
    const nextArea = value === 'all' ? undefined : value
    setActiveArea(nextArea)
    setSelection([])
  })

  const handleSceneModeChange = useCallbackRef((mode: SceneMode) => {
    setSceneMode(mode)
    setMapVisibility(mode === 'map')
  })

  const handleSelectEntity = useCallbackRef((id?: string) => {
    setSelection(id ? [id] : [])
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
      toast.error('Snapshot unavailable: 3D view not ready')
      return
    }
    const dataUrl = captureApi.captureFrame(2)
    if (!dataUrl) {
      toast.error('Snapshot failed')
      return
    }
    downloadDataUrl(dataUrl, createSnapshotFilename())
    triggerFlash()
    toast.success('✓ Snapshot saved')
  })

  const handleBackToEditor = useCallbackRef(() => {
    setViewMode('editor')
  })

  React.useEffect(
    () => () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current)
      }
    },
    [],
  )

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden overscroll-none'>
      <SimulationTopBar
        activeAreaId={activeAreaId}
        areaOptions={areaOptions}
        isRecording={isRecording}
        recordingLabel={`REC ${formattedTime}`}
        onAreaChange={handleAreaChange}
        onBackToEditor={handleBackToEditor}
        onSceneModeChange={handleSceneModeChange}
        onSnapshot={handleSnapshot}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        sceneMode={scene.mode}
      />

      <div className='flex flex-1 min-h-0 overflow-hidden'>
        <SimulationViewport
          fps={fps}
          isLowFps={isLowFps}
          isRecording={isRecording}
          recordingLabel={`REC ${formattedTime}`}
          showFlash={flashActive}
        >
          <SimulationCanvas
            cameraFeedTargets={feedTargets}
            scene={scene}
            selectedEntityIds={selectedEntityIds}
            focusAreaId={scene.activeAreaId}
            onSelectEntity={handleSelectEntity}
            sceneMode={scene.mode}
            showMapTexture={
              scene.mode === 'canvas'
                ? true
                : scene.mapVisible && scene.mode === 'map'
            }
            onCaptureReady={handleCaptureReady}
          />
        </SimulationViewport>
        <div className='flex h-full min-h-0 shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain border-l'>
          <SimulationRadar
            size={radarPanelSize}
            scene={scene}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={handleSelectEntity}
          />
          {scene.cameras.length > 0 ? (
            <SimulationCameraSidebar feedTargets={feedTargets} scene={scene} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
