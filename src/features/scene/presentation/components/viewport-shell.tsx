import type {MapRef} from 'react-map-gl/mapbox'

import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import type {EditorMode} from '../../domain/types'
import type {ShapeDrawMode} from '../types'

import {MapView} from './map-view'

interface ViewportShellProps {
  editorMode: EditorMode
  mapVisible: boolean
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  onBlankClick: () => void
  onMapReady?: (map: MapRef | null) => void
}
export const ViewportShell: React.FC<ViewportShellProps> = ({
  activeTool,
  shapeMode,
  onBlankClick,
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
    </div>
  )
}
