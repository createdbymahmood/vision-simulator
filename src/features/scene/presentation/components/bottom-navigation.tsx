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
    <div className='vs:pointer-events-none vs:fixed vs:inset-x-0 vs:bottom-4 vs:z-30 vs:flex vs:justify-center'>
      <div className='vs:pointer-events-auto vs:flex vs:w-full vs:max-w-fit vs:items-center vs:justify-between vs:rounded-lg vs:shadow-lg vs:gap-2 vs:bg-background vs:p-2 vs:border'>
        <ToolButton
          active={activeTool === 'select'}
          disabled={!isEditMode}
          label='Selector'
          icon={<MousePointer2 className='vs:size-5' />}
          onClick={() => onSelectTool('select')}
        />

        <ToolButton
          active={activeTool === 'hand'}
          disabled={!isEditMode}
          label='Hand Mode'
          icon={<Hand className='vs:size-5' />}
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
          icon={<BrickWall className='vs:size-5' />}
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
