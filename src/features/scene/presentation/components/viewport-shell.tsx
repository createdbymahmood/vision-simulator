import type {MapRef} from 'react-map-gl/mapbox'

import {Ruler} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {Button} from '@/components/ui/button'

import type {EditorMode} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {MapView} from './map-view'

interface ViewportShellProps {
  editorMode: EditorMode
  mapVisible: boolean
  measurementEnabled: boolean
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  onBlankClick: () => void
  onToggleMeasurement: () => void
  onMapReady?: (map: MapRef | null) => void
}
export const ViewportShell: React.FC<ViewportShellProps> = ({
  measurementEnabled,
  activeTool,
  shapeMode,
  onBlankClick,
  onToggleMeasurement,
  onMapReady,
}) => {
  return (
    <div
      className='relative w-full overflow-hidden backdrop-blur-lg h-full flex-1'
      onMouseDown={onBlankClick}
    >
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
          size='icon'
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
