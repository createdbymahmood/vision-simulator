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
      <div className='pointer-events-auto flex w-full max-w-fit items-center justify-between rounded-lg shadow-lg gap-2 bg-background p-2 border'>
        <ToolButton
          active={activeTool === 'select'}
          disabled={!isEditMode}
          label='Selector'
          icon={<MousePointer2 className='size-5' />}
          onClick={() => onSelectTool('select')}
        />

        <ToolButton
          active={activeTool === 'hand'}
          disabled={!isEditMode}
          label='Hand Mode'
          icon={<Hand className='size-5' />}
          onClick={() => onSelectTool('hand')}
        />

        <CreateAreaPopover
          disabled={!isEditMode}
          activeTool={activeTool}
          onSelectTool={() => onSelectTool('draw-area')}
          tooltip={!isEditMode ? 'Editing is disabled' : undefined}
        />

        <ToolButton
          active={activeTool === 'draw-wall'}
          disabled={dependentDisabled}
          label='Draw Wall'
          icon={<BrickWall className='size-5' />}
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
          tooltip={dependentDisabled ? disabledToolTooltip : undefined}
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
