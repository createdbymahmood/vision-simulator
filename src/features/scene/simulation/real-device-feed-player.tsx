import type {PlayerState} from '@vega-tek-hub/media-mtx-player'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {createMediaMTXPlayer} from '@vega-tek-hub/media-mtx-player'
import {Expand, Minimize2, Play, Square} from 'lucide-react'
import React from 'react'

import type {CameraEntity} from '@/features/scene/types/types'

import {Button} from '@/components/ui/button'
import {useUiStore} from '@/features/scene/state/ui.store'

interface RealDeviceFeedPlayerProps {
  camera: CameraEntity
  allowFullscreen?: boolean
  autoPlay?: boolean
  showControls?: boolean
}

interface RealDeviceFeedControlsProps {
  allowFullscreen: boolean
  canControlPlayback: boolean
  isBusy: boolean
  isFullscreen: boolean
  isPlaying: boolean
  showControls: boolean
  statusLabel: string
  title: string
  onToggleFullscreen: () => void
  onTogglePlayback?: () => void
}

interface UseRealDevicePlayerInput {
  accessToken?: string
  autoPlay: boolean
  streamUrl: string | null
}

const PLAYER_STATUS_LABELS: Record<PlayerState, string> = {
  idle: 'Idle',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  playing: 'Playing',
  stopped: 'Stopped',
  destroyed: 'Destroyed',
  error: 'Error',
}

const createPlayerUrl = (mediaMtxUrl: string, deviceId: string) => {
  const base = mediaMtxUrl.replace(/\/+$/, '')
  return `${base}/live_cam_${deviceId}/whep`
}

const useBodyScrollLock = (enabled: boolean) => {
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [enabled])
}

const useRealDevicePlayer = ({
  accessToken,
  autoPlay,
  streamUrl,
}: UseRealDevicePlayerInput) => {
  const [containerElement, setContainerElement] =
    React.useState<HTMLDivElement | null>(null)
  const [playerState, setPlayerState] = React.useState<PlayerState>('idle')
  const playerRef = React.useRef<ReturnType<
    typeof createMediaMTXPlayer
  > | null>(null)

  const cleanup = useCallbackRef(() => {
    if (!playerRef.current) {
      return
    }
    playerRef.current.destroy()
    playerRef.current = null
  })

  React.useEffect(() => {
    cleanup()
    setPlayerState('idle')

    if (!containerElement || !streamUrl) {
      return
    }

    playerRef.current = createMediaMTXPlayer({
      url: streamUrl,
      element: containerElement,
      protocol: 'auto',
      video: {
        controls: false,
        muted: autoPlay,
        autoplay: autoPlay,
        playsInline: true,
      },
      token: accessToken,
      reconnect: true,
      onStateChange: (nextState) => {
        setPlayerState(nextState)
      },
    })

    setPlayerState(playerRef.current.state)

    if (autoPlay) {
      void playerRef.current.play()
    }

    return cleanup
  }, [accessToken, autoPlay, cleanup, containerElement, streamUrl])

  const togglePlayback = useCallbackRef(() => {
    if (!playerRef.current) {
      return
    }

    if (playerRef.current.state === 'playing') {
      playerRef.current.stop()
      return
    }

    void playerRef.current.play()
  })

  return {
    containerElement,
    playerRef,
    playerState,
    setContainerElement,
    togglePlayback,
  }
}

const RealDeviceFeedControls: React.FC<RealDeviceFeedControlsProps> = ({
  allowFullscreen,
  canControlPlayback,
  isBusy,
  isFullscreen,
  isPlaying,
  showControls,
  statusLabel,
  title,
  onToggleFullscreen,
  onTogglePlayback,
}) => (
  <div
    className={`vs:absolute vs:inset-0 vs:z-20 vs:flex vs:items-end ${showControls ? '' : 'vs:pointer-events-none vs:opacity-0'}`}
  >
    <div className='vs:w-full vs:bg-gradient-to-t vs:from-black/70 vs:via-black/40 vs:to-transparent vs:px-3 vs:py-2'>
      <div className='vs:flex vs:items-center vs:gap-2 vs:text-white'>
        <span className='vs:line-clamp-1 vs:text-xs vs:font-medium'>
          {title}
        </span>
      </div>
      <div className='vs:flex vs:items-center vs:gap-2'>
        {onTogglePlayback ? (
          <Button
            size='icon-sm'
            className='vs:text-white vs:hover:bg-white/15 vs:hover:text-white'
            disabled={!canControlPlayback || isBusy}
            variant='ghost'
            onClick={() => onTogglePlayback()}
          >
            {isPlaying ? (
              <Square className='vs:size-4' />
            ) : (
              <Play className='vs:size-4' />
            )}
          </Button>
        ) : null}
        <span className='vs:text-xs vs:text-white/90'>{statusLabel}</span>

        {allowFullscreen ? (
          <Button
            size='icon-sm'
            className='vs:ml-auto vs:text-white vs:hover:bg-white/15 vs:hover:text-white'
            variant='ghost'
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className='vs:size-4' />
            ) : (
              <Expand className='vs:size-4' />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  </div>
)

export const RealDeviceFeedPlayer: React.FC<RealDeviceFeedPlayerProps> = ({
  camera,
  allowFullscreen = true,
  autoPlay = false,
  showControls = true,
}) => {
  const accessToken = useUiStore((state) => state.accessToken)
  const mediaMtxUrl = useUiStore((state) => state.mediaMtxUrl)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const streamUrl = React.useMemo(() => {
    if (!mediaMtxUrl || !camera.sourceDeviceId) {
      return null
    }

    return createPlayerUrl(mediaMtxUrl, camera.sourceDeviceId)
  }, [camera.sourceDeviceId, mediaMtxUrl])
  const {playerRef, playerState, setContainerElement, togglePlayback} =
    useRealDevicePlayer({
      accessToken,
      autoPlay,
      streamUrl,
    })

  const canControlPlayback = Boolean(playerRef.current && streamUrl)
  const statusLabel = PLAYER_STATUS_LABELS[playerState] ?? 'Idle'
  const title = camera.sourceDeviceName || camera.name
  const isFullscreen = allowFullscreen && isExpanded
  const isBusy = playerState === 'connecting' || playerState === 'reconnecting'
  const isPlaying = playerState === 'playing'
  const wrapperClassName = isFullscreen
    ? 'fixed inset-0 z-50 flex min-h-0 w-full flex-col bg-black'
    : 'relative size-full min-w-0 max-w-full overflow-hidden bg-black'
  const hasConfigError = !streamUrl
  const hasStreamError = playerState === 'error'

  useBodyScrollLock(isFullscreen)

  return (
    <div className={wrapperClassName}>
      <div
        ref={setContainerElement}
        className={
          isFullscreen ? 'vs:min-h-0 vs:w-full vs:flex-1' : 'vs:size-full'
        }
      />

      {hasConfigError ? (
        <div className='vs:pointer-events-none vs:absolute vs:inset-0 vs:z-10 vs:flex vs:items-center vs:justify-center vs:bg-black/70 vs:px-3 vs:text-center vs:text-xs vs:text-white/85'>
          Media stream URL is not configured.
        </div>
      ) : null}

      {hasStreamError ? (
        <div className='vs:pointer-events-none vs:absolute vs:inset-0 vs:z-10 vs:flex vs:items-center vs:justify-center vs:bg-black/40 vs:px-3 vs:text-center vs:text-xs vs:text-white/85'>
          Unable to load live stream.
        </div>
      ) : null}

      <RealDeviceFeedControls
        isBusy={isBusy}
        isFullscreen={isFullscreen}
        isPlaying={isPlaying}
        statusLabel={statusLabel}
        title={title}
        allowFullscreen={allowFullscreen}
        canControlPlayback={canControlPlayback}
        onToggleFullscreen={() => setIsExpanded((previous) => !previous)}
        onTogglePlayback={autoPlay ? undefined : togglePlayback}
        showControls={showControls}
      />
    </div>
  )
}
