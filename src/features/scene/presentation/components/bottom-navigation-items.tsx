import {
  Camera,
  Hand,
  Hexagon,
  LineChart,
  MousePointer2,
  Pointer,
  Shapes,
  User,
} from 'lucide-react'
import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

import type {AreaCreationMode, ShapeDrawMode} from '../types'

export const TOOL_ITEM_CLASS =
  'h-16 w-20 flex flex-col items-center justify-center gap-1 rounded-lg'

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
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={active ? 'default' : 'ghost'}
          onClick={onClick}
        >
          {icon}
          <span className='text-xs'>{label}</span>
        </Button>
      </TooltipTrigger>
      {disabled && tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
    </Tooltip>
  )
}

interface ModePopoverProps {
  activeTool: EditorTool
  disabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (tool: EditorTool) => void
}

export const ModePopover: React.FC<ModePopoverProps> = ({
  activeTool,
  disabled,
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={
            ['hand', 'select'].includes(activeTool) ? 'default' : 'ghost'
          }
        >
          {activeTool === 'hand' ? (
            <Hand className='h-5 w-5' />
          ) : (
            <MousePointer2 className='h-5 w-5' />
          )}
          <span className='text-xs'>Mode</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-48' side='top'>
        <div className='flex flex-col gap-2'>
          <Button
            variant={activeTool === 'hand' ? 'default' : 'ghost'}
            onClick={() => {
              onSelect('hand')
              onOpenChange(false)
            }}
          >
            <Hand className='h-4 w-4' />
            Hand Mode (H)
          </Button>
          <Button
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            onClick={() => {
              onSelect('select')
              onOpenChange(false)
            }}
          >
            <Pointer className='h-4 w-4' />
            Selector (V)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CreateAreaPopoverProps {
  activeTool: EditorTool
  areaMode: AreaCreationMode
  hasAreas: boolean
  disabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTool: () => void
  onSelectAreaMode: (mode: AreaCreationMode) => void
}

export const CreateAreaPopover: React.FC<CreateAreaPopoverProps> = ({
  activeTool,
  areaMode,
  hasAreas,
  disabled,
  open,
  onOpenChange,
  onSelectTool,
  onSelectAreaMode,
}) => {
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={TOOL_ITEM_CLASS}
          disabled={disabled}
          variant={activeTool === 'draw-area' ? 'default' : 'ghost'}
        >
          <div className='relative'>
            <Hexagon className='h-5 w-5' />
            {!hasAreas ? (
              <Badge className='absolute -right-2 -top-2'>Required</Badge>
            ) : null}
          </div>
          <span className='text-xs'>Create Area</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' className='w-52' side='top'>
        <div className='flex flex-col gap-2'>
          <Button
            variant={areaMode === 'point' ? 'default' : 'ghost'}
            onClick={() => {
              onSelectAreaMode('point')
              onSelectTool()
              onOpenChange(false)
            }}
          >
            <Pointer className='h-4 w-4' />
            Point Mode (A)
          </Button>
          <Button
            variant={areaMode === 'pen' ? 'default' : 'ghost'}
            onClick={() => {
              onSelectAreaMode('pen')
              onSelectTool()
              onOpenChange(false)
            }}
          >
            <LineChart className='h-4 w-4' />
            Pen Mode
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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

const SHAPE_OPTIONS: {label: string; mode: ShapeDrawMode; shortcut: string}[] =
  [
    {label: 'Rectangle', mode: 'rectangle', shortcut: 'R'},
    {label: 'Circle', mode: 'circle', shortcut: 'C'},
    {label: 'Triangle', mode: 'triangle', shortcut: 'T'},
    {label: 'Line', mode: 'line', shortcut: 'L'},
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
          <Shapes className='h-5 w-5' />
          <span className='text-xs'>Draw Shapes</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' className='w-52' side='top'>
        <div className='grid grid-cols-2 gap-2'>
          {SHAPE_OPTIONS.map((option) => (
            <Button
              key={option.mode}
              variant={shapeMode === option.mode ? 'default' : 'ghost'}
              onClick={() => {
                onSelectTool()
                onSelectShape(option.mode)
                onOpenChange(false)
              }}
            >
              {option.label} ({option.shortcut})
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
        icon={<Camera className='h-5 w-5' />}
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
        icon={<User className='h-5 w-5' />}
        onClick={() => {
          onSelectTool('place-person')
          onPlacePerson()
        }}
        tooltip={disabled ? disabledTooltip : undefined}
      />
    </>
  )
}
