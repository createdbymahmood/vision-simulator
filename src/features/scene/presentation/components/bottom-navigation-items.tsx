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
  'h-10 w-10 flex items-center justify-center rounded-lg'

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
  tooltip?: string
  onSelectTool: () => void
}

export const CreateAreaPopover: React.FC<CreateAreaPopoverProps> = ({
  activeTool,
  disabled,
  tooltip,
  onSelectTool,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label='Create Area'
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={activeTool === 'draw-area' ? 'default' : 'ghost'}
          onClick={() => {
            onSelectTool()
          }}
        >
          <div className='relative'>
            <Hexagon className='size-5' />
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? 'Create Area'}</TooltipContent>
    </Tooltip>
  )
}

interface ShapePopoverProps {
  activeTool: EditorTool
  shapeMode: ShapeDrawMode
  disabled: boolean
  open: boolean
  tooltip?: string
  onOpenChange: (open: boolean) => void
  onSelectTool: () => void
  onSelectShape: (mode: ShapeDrawMode) => void
}

const SHAPE_OPTIONS: {
  label: string
  mode: ShapeDrawMode
  shortcut: string
  icon: React.ComponentType<{className?: string}>
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
  tooltip,
  onOpenChange,
  onSelectTool,
  onSelectShape,
}) => {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label='Draw Shape'
              className={TOOL_ITEM_CLASS}
              disabled={disabled}
              variant={activeTool === 'draw-shape' ? 'default' : 'ghost'}
            >
              <Shapes className='size-5' />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{tooltip ?? 'Draw Shape'}</TooltipContent>
      </Tooltip>
      <PopoverContent align='center' className='w-56 p-3' side='top'>
        <div className='grid grid-cols-2 gap-2'>
          {SHAPE_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <Button
                className='flex h-auto flex-col items-center gap-1 py-3'
                key={option.mode}
                title={`${option.label} (${option.shortcut})`}
                variant={shapeMode === option.mode ? 'default' : 'ghost'}
                onClick={() => {
                  onSelectTool()
                  onSelectShape(option.mode)
                  onOpenChange(false)
                }}
              >
                <Icon className='h-6 w-6' />
                <span className='text-xs font-medium'>{option.shortcut}</span>
              </Button>
            )
          })}
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
        icon={<Camera className='size-5' />}
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
        icon={<User className='size-5' />}
        onClick={() => {
          onSelectTool('place-person')
          onPlacePerson()
        }}
        tooltip={disabled ? disabledTooltip : undefined}
      />
    </>
  )
}
