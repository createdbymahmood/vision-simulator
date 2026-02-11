import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'
import {toast} from 'sonner'

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

export const SimulationAnalysisView: React.FC<SimulationAnalysisViewProps> = ({
  showTopBar = true,
  showAuxiliaryPanels = true,
  allowBackToEditor = true,
  onBackToEditor,
}) => {
  const scene = useSceneStore((state) => state.scene)
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

  const feedTargets = useCameraFeedTargets({cameras: scene.cameras})

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

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden overscroll-none'>
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
            editorMode={scene.editorMode}
            focusAreaId={scene.activeAreaId}
            onCaptureReady={handleCaptureReady}
            onSelectEntity={handleSelectEntity}
            showMapTexture={scene.editorMode === 'map' && scene.mapVisible}
          />
        </SimulationViewport>
        {showAuxiliaryPanels ? (
          <div className='flex h-full min-h-0 shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain border-l'>
            <SimulationRadar
              size={radarPanelSize}
              scene={scene}
              selectedEntityIds={selectedEntityIds}
              onSelectEntity={handleSelectEntity}
            />
            {scene.cameras.length > 0 ? (
              <SimulationCameraSidebar
                feedTargets={feedTargets}
                scene={scene}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
