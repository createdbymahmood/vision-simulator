import {Grid, Map, Ruler} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

import type {SceneMode, ViewMode} from '../../domain/types'

import {MapView} from './map-view'

interface ViewportShellProps {
  sceneMode: SceneMode
  viewMode: ViewMode
  mapVisible: boolean
  snapToGrid: boolean
  measurementEnabled: boolean
  onBlankClick: () => void
  onToggleSnap: () => void
  onToggleMeasurement: () => void
}
export const ViewportShell: React.FC<ViewportShellProps> = ({
  sceneMode,
  viewMode,
  mapVisible,
  snapToGrid,
  measurementEnabled,
  onBlankClick,
  onToggleSnap,
  onToggleMeasurement,
}) => {
  return (
    <div
      className='relative w-full overflow-hidden backdrop-blur-lg h-full flex-1'
      onMouseDown={onBlankClick}
    >
      <div className={cn('absolute inset-0 transition-all duration-200')} />

      <div className='absolute inset-0 flex items-center justify-center'>
        {sceneMode === 'map' && mapVisible ? (
          <MapView />
        ) : (
          <div className='flex flex-row gap-2 items-center'>
            <Grid className='h-4 w-4' />
            <span className='text-sm'>Canvas Mode</span>
          </div>
        )}
      </div>

      {viewMode === 'preview' ? (
        <div className='absolute left-4 top-4 rounded-full bg-emerald-500/80 px-4 py-1 text-xs font-semibold text-white shadow-sm'>
          Preview View
        </div>
      ) : null}

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
