import {Grid, Map, Ruler} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

import type {SceneMode, ViewMode} from '../../domain/types'
import type {CursorPosition} from '../types'

interface ViewportShellProps {
  sceneMode: SceneMode
  viewMode: ViewMode
  mapVisible: boolean
  cursor: CursorPosition
  snapToGrid: boolean
  measurementEnabled: boolean
  onCursorMove: (position: CursorPosition) => void
  onBlankClick: () => void
  onToggleSnap: () => void
  onToggleMeasurement: () => void
}

const metersFromPixels = (pixelDelta: number) => pixelDelta / 10

export const ViewportShell: React.FC<ViewportShellProps> = ({
  sceneMode,
  viewMode,
  mapVisible,
  cursor,
  snapToGrid,
  measurementEnabled,
  onCursorMove,
  onBlankClick,
  onToggleSnap,
  onToggleMeasurement,
}) => {
  return (
    <div
      className='relative w-full overflow-hidden backdrop-blur-lg h-full flex-1'
      onMouseDown={onBlankClick}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const relativeX = metersFromPixels(
          event.clientX - rect.left - rect.width / 2,
        )
        const relativeY = metersFromPixels(
          rect.height / 2 - (event.clientY - rect.top),
        )
        onCursorMove({x: relativeX, y: relativeY})
      }}
    >
      <div className={cn('absolute inset-0 transition-all duration-200')} />

      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm backdrop-blur'>
          {sceneMode === 'map' && mapVisible ? (
            <>
              <Map className='h-4 w-4' />
              <span>Map Mode</span>
            </>
          ) : (
            <>
              <Grid className='h-4 w-4' />
              <span>Canvas Mode</span>
            </>
          )}
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className='absolute left-4 top-4 rounded-full bg-emerald-500/80 px-4 py-1 text-xs font-semibold text-white shadow-sm'>
          Preview View
        </div>
      ) : null}

      <div
        className='absolute bottom-4 left-4 rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/60'
        onMouseDown={(event) => event.stopPropagation()}
      >
        X: {cursor.x.toFixed(1)} m | Y: {cursor.y.toFixed(1)} m
      </div>

      <div
        className='absolute bottom-4 right-4 flex flex-col gap-2'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Button
          size='icon-lg'
          aria-label='Snap to grid (0.5m)'
          aria-pressed={snapToGrid}
          className='h-12 w-12 rounded-full'
          variant={snapToGrid ? 'default' : 'outline'}
          onClick={onToggleSnap}
        >
          <Grid className='h-5 w-5' />
        </Button>
        <Button
          size='icon-lg'
          aria-label='Measurement overlay'
          aria-pressed={measurementEnabled}
          className='h-12 w-12 rounded-full'
          variant={measurementEnabled ? 'default' : 'outline'}
          onClick={onToggleMeasurement}
        >
          <Ruler className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}
