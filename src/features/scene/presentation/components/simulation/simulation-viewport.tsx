import React from 'react'

import {Badge} from '@/components/ui/badge'
import {cn} from '@/lib/utils'

interface SimulationViewportProps {
  isRecording: boolean
  recordingLabel: string
  isLowFps: boolean
  fps: number | null
  showFlash: boolean
  children: React.ReactNode
}

export const SimulationViewport: React.FC<SimulationViewportProps> = ({
  isRecording,
  recordingLabel,
  isLowFps,
  fps,
  showFlash,
  children,
}) => {
  return (
    <div
      className={cn(
        'relative z-1 min-h-0 min-w-0 flex-1 overflow-hidden',
        isRecording ? 'ring-2 ring-red-500/60' : '',
      )}
    >
      <div className='absolute inset-0'>{children}</div>

      {isRecording ? (
        <div className='absolute right-4 top-4 z-20 flex items-center gap-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white'>
          <span className='recording-dot size-2 rounded-full bg-red-500' />
          <span>{recordingLabel}</span>
          {isLowFps ? (
            <Badge className='h-5 px-2' variant='destructive'>
              {fps ? `FPS ${fps}` : 'FPS low'}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-white transition-opacity duration-100',
          showFlash ? 'opacity-80' : 'opacity-0',
        )}
      />
    </div>
  )
}
