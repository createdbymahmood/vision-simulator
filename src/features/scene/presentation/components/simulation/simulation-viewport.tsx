import React from 'react'

import {Badge} from '@/components/ui/badge'
import {cn} from '@/lib/utils'

interface SimulationViewportProps {
  isRecording: boolean
  recordingLabel: string
  isLowFps: boolean
  fps: number | null
  showFlash: boolean
  overlayControls?: React.ReactNode
  children: React.ReactNode
}

export const SimulationViewport: React.FC<SimulationViewportProps> = ({
  isRecording,
  recordingLabel,
  isLowFps,
  fps,
  showFlash,
  overlayControls,
  children,
}) => {
  return (
    <div
      className={cn(
        'vs:relative vs:z-1 vs:min-h-0 vs:min-w-0 vs:flex-1 vs:overflow-hidden',
        isRecording ? 'vs:ring-2 vs:ring-red-500/60' : '',
      )}
    >
      <div className='vs:absolute vs:inset-0'>{children}</div>

      {isRecording ? (
        <div className='vs:absolute vs:right-4 vs:top-4 vs:z-20 vs:flex vs:items-center vs:gap-3 vs:rounded-full vs:bg-black/70 vs:px-3 vs:py-1 vs:text-xs vs:font-semibold vs:text-white'>
          <span className='recording-dot vs:size-2 vs:rounded-full vs:bg-red-500' />
          <span>{recordingLabel}</span>
          {isLowFps ? (
            <Badge className='vs:h-5 vs:px-2' variant='destructive'>
              {fps ? `FPS ${fps}` : 'FPS low'}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {overlayControls ? (
        <div className='vs:pointer-events-none vs:absolute vs:inset-0 vs:z-20'>
          {overlayControls}
        </div>
      ) : null}

      <div
        className={cn(
          'vs:pointer-events-none vs:absolute vs:inset-0 vs:bg-white vs:transition-opacity vs:duration-100',
          showFlash ? 'vs:opacity-80' : 'vs:opacity-0',
        )}
      />
    </div>
  )
}
