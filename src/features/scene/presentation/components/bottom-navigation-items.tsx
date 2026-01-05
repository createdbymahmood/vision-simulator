import {
  Camera,
  Circle,
  Hexagon,
  PenLine,
  Shapes,
  Square,
  Triangle,
  User,
} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

import type {ShapeDrawMode} from '../types'

export const TOOL_ITEM_CLASS =
  'h-10 w-10 flex items-center justify-center rounded-full'

interface ToolButtonProps {
  label: string
  icon: React.ReactNode
  active: boolean
  disabled?: boolean
  tooltip?: string
  onClick: () => void
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  label,
  icon,
  active,
  disabled,
  tooltip,
  onClick,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={active ? 'default' : 'ghost'}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  )
}

interface CreateAreaPopoverProps {
  activeTool: EditorTool
  disabled: boolean
  onSelectTool: () => void
}

export const CreateAreaPopover: React.FC<CreateAreaPopoverProps> = ({
  activeTool,
  disabled,
  onSelectTool,
}) => {
  return (
    <Button
      className={TOOL_ITEM_CLASS}
      disabled={disabled}
      variant={activeTool === 'draw-area' ? 'default' : 'ghost'}
      onClick={() => {
        onSelectTool()
      }}
    >
      <div className='relative'>
        <Hexagon className='h-6 w-6' />
      </div>
    </Button>
  )
}

interface ShapePopoverProps {
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  disabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTool: () => void
  onSelectShape: (mode: ShapeDrawMode) => void
}

const SHAPE_OPTIONS: {
  label: string
  mode: ShapeDrawMode
  shortcut: string
  icon: React.FC
}[] = [
  {label: 'Rectangle', mode: 'rectangle', shortcut: 'R', icon: Square},
  {label: 'Circle', mode: 'circle', shortcut: 'C', icon: Circle},
  {label: 'Triangle', mode: 'triangle', shortcut: 'T', icon: Triangle},
  {label: 'Line', mode: 'line', shortcut: 'L', icon: PenLine},
]

export const ShapePopover: React.FC<ShapePopoverProps> = ({
  activeTool,
  shapeMode,
  disabled,
  open,
  onOpenChange,
  onSelectTool,
  onSelectShape,
}) => {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={activeTool === 'draw-shape' ? 'default' : 'ghost'}
        >
          <Shapes className='h-6 w-6' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' className='w-fit p-1' side='top'>
        <div className='flex flex-col gap-2'>
          {SHAPE_OPTIONS.map((option) => (
            <Button
              size='icon'
              key={option.mode}
              title={`${option.label} (${option.shortcut})`}
              variant={shapeMode === option.mode ? 'default' : 'ghost'}
              onClick={() => {
                onSelectTool()
                onSelectShape(option.mode)
                onOpenChange(false)
              }}
            >
              <option.icon />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface PlacementButtonsProps {
  activeTool: EditorTool
  disabled: boolean
  disabledTooltip: string
  onSelectTool: (tool: EditorTool) => void
  onOpenPlaceDevice: () => void
  onPlacePerson: () => void
}

export const PlacementButtons: React.FC<PlacementButtonsProps> = ({
  activeTool,
  disabled,
  disabledTooltip,
  onSelectTool,
  onOpenPlaceDevice,
  onPlacePerson,
}) => {
  return (
    <>
      <ToolButton
        active={activeTool === 'place-camera'}
        disabled={disabled}
        label='Place Device'
        icon={<Camera className='h-6 w-6' />}
        onClick={() => {
          onSelectTool('place-camera')
          onOpenPlaceDevice()
        }}
        tooltip={disabled ? disabledTooltip : undefined}
      />
      <ToolButton
        active={activeTool === 'place-person'}
        disabled={disabled}
        label='Place Person'
        icon={<User className='h-6 w-6' />}
        onClick={() => {
          onSelectTool('place-person')
          onPlacePerson()
        }}
        tooltip={disabled ? disabledTooltip : undefined}
      />
    </>
  )
}
