import type {MapRef} from 'react-map-gl/mapbox'

import {Ruler} from 'lucide-react'
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
  onMapReady?: (map: MapRef | null) => void
}
export const ViewportShell: React.FC<ViewportShellProps> = ({
  sceneMode,
  mapVisible,
  measurementEnabled,
  activeTool,
  shapeMode,
  onBlankClick,
  onToggleMeasurement,
  onMapReady,
}) => {
  const showGrid = sceneMode === 'canvas' || !mapVisible
  const gridStyle = showGrid
    ? {
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.25) 1px, transparent 1px)',
        backgroundSize: '20px 20px, 20px 20px, 200px 200px, 200px 200px',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0',
      }
    : undefined

  return (
    <div
      className='relative w-full overflow-hidden backdrop-blur-lg h-full flex-1'
      onMouseDown={onBlankClick}
    >
      <div
        style={gridStyle}
        className={cn(
          'absolute inset-0 transition-all duration-200 pointer-events-none',
          showGrid ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className='absolute inset-0'>
        <MapView
          activeTool={activeTool}
          onMapReady={onMapReady}
          shapeMode={shapeMode}
        />
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
