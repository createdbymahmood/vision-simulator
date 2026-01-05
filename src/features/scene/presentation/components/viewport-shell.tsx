import {Grid, Hand, MousePointer2, Ruler} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {cn} from '@/lib/utils'

import type {SceneMode, ViewMode} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {MapView} from './map-view'

interface ViewportShellProps {
  sceneMode: SceneMode
  viewMode: ViewMode
  mapVisible: boolean
  snapToGrid: boolean
  measurementEnabled: boolean
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  onSelectTool: (tool: EditorTool) => void
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
  activeTool,
  shapeMode,
  onSelectTool,
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
        className='absolute left-4 top-4 z-30 flex flex-col gap-2'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size='sm'
              className='gap-2 rounded-full bg-white/80'
              variant='outline'
            >
              {activeTool === 'hand' ? (
                <Hand className='h-4 w-4' />
              ) : (
                <MousePointer2 className='h-4 w-4' />
              )}
              <span className='text-sm font-medium'>
                {activeTool === 'hand' ? 'Hand Mode' : 'Selector'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-48' side='right'>
            <div className='flex flex-col gap-2'>
              <Button
                className='justify-start gap-2'
                variant={activeTool === 'hand' ? 'default' : 'ghost'}
                onClick={() => onSelectTool('hand')}
              >
                <Hand className='h-4 w-4' />
                Hand (H)
              </Button>
              <Button
                className='justify-start gap-2'
                variant={activeTool === 'select' ? 'default' : 'ghost'}
                onClick={() => onSelectTool('select')}
              >
                <MousePointer2 className='h-4 w-4' />
                Selector (V)
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {viewMode === 'preview' ? (
          <div className='rounded-full bg-emerald-500/80 px-4 py-1 text-xs font-semibold text-white shadow-sm'>
            Preview View
          </div>
        ) : null}
      </div>

      <div
        className='absolute bottom-4 right-4 flex flex-col gap-2'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Button
          size='icon-lg'
          aria-label='Snap to grid (0.5m)'
          aria-pressed={snapToGrid}
          className='rounded-full backdrop-blur-md'
          variant={snapToGrid ? 'default' : 'outline'}
          onClick={onToggleSnap}
        >
          <Grid className='h-5 w-5' />
        </Button>
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
