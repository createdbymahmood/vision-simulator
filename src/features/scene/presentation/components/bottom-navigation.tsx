import {BrickWall, Hand, MousePointer2} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {ShapeDrawMode} from '../types'

import {
  CreateAreaPopover,
  PlacementButtons,
  ShapePopover,
  ToolButton,
} from './bottom-navigation-items'

interface BottomNavigationProps {
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  isEditMode: boolean
  hasAreas: boolean
  onSelectTool: (tool: EditorTool) => void
  onSelectShapeMode: (mode: ShapeDrawMode) => void
  onOpenPlaceDevice: () => void
  onPlacePerson: () => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTool,
  shapeMode,
  isEditMode,
  hasAreas,
  onSelectTool,
  onSelectShapeMode,
  onOpenPlaceDevice,
  onPlacePerson,
}) => {
  const popovers = useUiStore((state) => state.openPopovers)
  const setPopoverState = useUiStore((state) => state.setPopoverState)

  const disabledToolTooltip = !hasAreas
    ? 'Requires at least one area'
    : 'Editing is disabled'

  const dependentDisabled = !isEditMode || !hasAreas

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center'>
      <div className='pointer-events-auto flex py-1 w-full max-w-fit items-center justify-between rounded-full px-1 backdrop-blur shadow-lg gap-2 bg-white/30'>
        <ToolButton
          active={activeTool === 'hand'}
          disabled={!isEditMode}
          label='Hand Mode'
          icon={<Hand className='h-6 w-6' />}
          onClick={() => onSelectTool('hand')}
        />
        <ToolButton
          active={activeTool === 'select'}
          disabled={!isEditMode}
          label='Selector'
          icon={<MousePointer2 className='h-6 w-6' />}
          onClick={() => onSelectTool('select')}
        />

        <CreateAreaPopover
          disabled={!isEditMode}
          activeTool={activeTool}
          onSelectTool={() => onSelectTool('draw-area')}
        />

        <ToolButton
          active={activeTool === 'draw-wall'}
          disabled={dependentDisabled}
          label='Draw Wall'
          icon={<BrickWall className='h-6 w-6' />}
          onClick={() => onSelectTool('draw-wall')}
          tooltip={dependentDisabled ? disabledToolTooltip : undefined}
        />

        <ShapePopover
          disabled={dependentDisabled}
          activeTool={activeTool}
          onOpenChange={(open) => setPopoverState('draw-shape', open)}
          onSelectShape={onSelectShapeMode}
          onSelectTool={() => onSelectTool('draw-shape')}
          open={!!popovers['draw-shape']}
          shapeMode={shapeMode}
        />

        <PlacementButtons
          disabled={dependentDisabled}
          activeTool={activeTool}
          disabledTooltip={disabledToolTooltip}
          onOpenPlaceDevice={onOpenPlaceDevice}
          onPlacePerson={onPlacePerson}
          onSelectTool={onSelectTool}
        />
      </div>
    </div>
  )
}
