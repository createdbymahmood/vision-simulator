import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {
  createSnapshotFilename,
  downloadDataUrl,
} from '@/features/scene/presentation/utils/scene-export'

import type {SimulationCaptureApi} from './simulation-capture'

import {SimulationCameraSidebar} from './simulation-camera-sidebar'
import {SimulationCanvas} from './simulation-canvas'
import {SimulationRadar} from './simulation-radar'
import {SimulationTopBar} from './simulation-top-bar'
import {SimulationViewport} from './simulation-viewport'
import {useCameraFeedTargets} from './use-camera-feed-targets'
import {useSimulationRecording} from './use-simulation-recording'

interface SimulationAnalysisViewProps {
  showTopBar?: boolean
  showAuxiliaryPanels?: boolean
  allowBackToEditor?: boolean
  onBackToEditor: () => void
}

// eslint-disable-next-line max-lines-per-function
export const SimulationAnalysisView: React.FC<SimulationAnalysisViewProps> = ({
  showTopBar = true,
  showAuxiliaryPanels = true,
  allowBackToEditor = true,
  onBackToEditor,
}) => {
  const scene = useSceneStore((state) => state.scene)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

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
  const radarPanelSize = {width: 360, height: 180}
  const activePreviewAreaId = React.useMemo(
    () => scene.activeAreaId ?? scene.areas[0]?.id,
    [scene.activeAreaId, scene.areas],
  )

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
  const hasCameraFeedTiles = feedTargets.length > 0
  const showSimulationSidePanels = showAuxiliaryPanels && hasCameraFeedTiles

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
    toast.success('Snapshot saved')
  })

  const handleBackAction = useCallbackRef(() => {
    if (!allowBackToEditor) {
      return
    }

    onBackToEditor()
  })

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
    <div className='flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-none'>
      {showTopBar ? (
        <SimulationTopBar
          isRecording={isRecording}
          onBackToEditor={handleBackAction}
          onSnapshot={handleSnapshot}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          recordingLabel={`REC ${formattedTime}`}
          showBackButton={allowBackToEditor}
        />
      ) : null}

      <div className='flex flex-1 min-h-0 min-w-0 overflow-hidden'>
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
            editorMode={scene.editorMode}
            focusAreaId={activePreviewAreaId}
            onCaptureReady={handleCaptureReady}
            onSelectEntity={handleSelectEntity}
            showMapTexture={scene.editorMode === 'map' && scene.mapVisible}
          />
          {scene.areas.length > 1 ? (
            <div className='pointer-events-none absolute left-4 top-4 z-20'>
              <div className='pointer-events-auto'>
                <Select
                  value={activePreviewAreaId}
                  onValueChange={handleActiveAreaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select area' />
                  </SelectTrigger>
                  <SelectContent>
                    {scene.areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </SimulationViewport>
        {showSimulationSidePanels ? (
          <div className='flex h-full min-h-0 w-[360px] max-w-[360px] shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain border-l'>
            <SimulationRadar
              size={radarPanelSize}
              scene={scene}
              selectedEntityIds={selectedEntityIds}
              focusAreaId={activePreviewAreaId}
              onSelectEntity={handleSelectEntity}
            />
            <SimulationCameraSidebar feedTargets={feedTargets} scene={scene} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
