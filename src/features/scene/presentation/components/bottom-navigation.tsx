import {BrickWall} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {AreaCreationMode, ShapeDrawMode} from '../types'

import {
  CreateAreaPopover,
  ModePopover,
  PlacementButtons,
  ShapePopover,
  ToolButton,
} from './bottom-navigation-items'

interface BottomNavigationProps {
  activeTool: EditorTool
  areaMode: AreaCreationMode
  shapeMode: ShapeDrawMode
  isEditMode: boolean
  hasAreas: boolean
  onSelectTool: (tool: EditorTool) => void
  onSelectAreaMode: (mode: AreaCreationMode) => void
  onSelectShapeMode: (mode: ShapeDrawMode) => void
  onOpenPlaceDevice: () => void
  onPlacePerson: () => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTool,
  areaMode,
  shapeMode,
  isEditMode,
  hasAreas,
  onSelectTool,
  onSelectAreaMode,
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
      <div className='pointer-events-auto flex h-16 w-full max-w-[800px] items-center justify-between rounded-2xl border border-white/50 px-1 backdrop-blur shadow-lg'>
        <ModePopover
          disabled={!isEditMode}
          activeTool={activeTool}
          onOpenChange={(open) => setPopoverState('mode', open)}
          onSelect={onSelectTool}
          open={!!popovers.mode}
        />

        <CreateAreaPopover
          disabled={!isEditMode}
          hasAreas={hasAreas}
          activeTool={activeTool}
          areaMode={areaMode}
          onOpenChange={(open) => setPopoverState('create-area', open)}
          onSelectAreaMode={onSelectAreaMode}
          onSelectTool={() => onSelectTool('draw-area')}
          open={!!popovers['create-area']}
        />

        <ToolButton
          active={activeTool === 'draw-wall'}
          disabled={dependentDisabled}
          label='Draw Wall'
          icon={<BrickWall className='h-5 w-5' />}
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
