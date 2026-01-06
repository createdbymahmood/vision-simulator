import {Grid, Ruler} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'

import type {SceneMode} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {MapView} from './map-view'

interface ViewportShellProps {
  sceneMode: SceneMode
  mapVisible: boolean
  measurementEnabled: boolean
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  onBlankClick: () => void
  onToggleMeasurement: () => void
}
export const ViewportShell: React.FC<ViewportShellProps> = ({
  sceneMode,
  mapVisible,
  measurementEnabled,
  activeTool,
  shapeMode,
  onBlankClick,
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
          <MapView activeTool={activeTool} shapeMode={shapeMode} />
        ) : (
          <div className='relative flex size-full items-center justify-center overflow-hidden'>
            <div
              className='absolute inset-0'
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.25) 1px, transparent 1px)',
                backgroundSize:
                  '20px 20px, 20px 20px, 200px 200px, 200px 200px',
                backgroundPosition: '0 0, 0 0, 0 0, 0 0',
              }}
            />
            <div className='relative flex flex-row items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow'>
              <Grid className='h-4 w-4' />
              <span className='text-sm font-medium text-muted-foreground'>
                Canvas Mode Grid (1m squares)
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className='absolute bottom-4 right-4 flex flex-col gap-2'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Button
          size='icon-lg'
          aria-label='Measurement overlay'
          aria-pressed={measurementEnabled}
          className='rounded-full backdrop-blur-md'
          variant={measurementEnabled ? 'default' : 'outline'}
          onClick={onToggleMeasurement}
        >
          <Ruler className='h-5 w-5' />
        </Button>
      </div>
    </div>
  )
}
