import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneMode, SceneTool} from '@/domains/scene/core/scene-types'

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface SceneCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectMode: (mode: SceneMode) => void
  onSelectTool: (tool: SceneTool) => void
  onResetScene: () => void
}

export const SceneCommandPalette: React.FC<SceneCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectMode,
  onSelectTool,
  onResetScene,
}) => {
  const handleSelectCanvasMode = useCallbackRef(() => onSelectMode('canvas'))
  const handleSelectMapMode = useCallbackRef(() => onSelectMode('map'))

  const handleSelectToolSelect = useCallbackRef(() => onSelectTool('select'))
  const handleSelectToolWall = useCallbackRef(() => onSelectTool('wall'))
  const handleSelectToolCamera = useCallbackRef(() => onSelectTool('camera'))
  const handleSelectToolShape = useCallbackRef(() => onSelectTool('shape'))
  const handleSelectToolPerson = useCallbackRef(() => onSelectTool('person'))
  const handleSelectToolArea = useCallbackRef(() => onSelectTool('area'))

  const handleResetScene = useCallbackRef(() => onResetScene())

  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput placeholder='Jump to a command' />
      <CommandList>
        <CommandGroup heading='Modes'>
          <CommandItem onSelect={handleSelectCanvasMode}>
            Canvas mode
          </CommandItem>
          <CommandItem onSelect={handleSelectMapMode}>Map mode</CommandItem>
        </CommandGroup>
        <CommandGroup heading='Tools'>
          <CommandItem onSelect={handleSelectToolSelect}>Select</CommandItem>
          <CommandItem onSelect={handleSelectToolWall}>Wall</CommandItem>
          <CommandItem onSelect={handleSelectToolCamera}>Camera</CommandItem>
          <CommandItem onSelect={handleSelectToolShape}>Shape</CommandItem>
          <CommandItem onSelect={handleSelectToolPerson}>Person</CommandItem>
          <CommandItem onSelect={handleSelectToolArea}>Area</CommandItem>
        </CommandGroup>
        <CommandGroup heading='Scene'>
          <CommandItem onSelect={handleResetScene}>Reset scene</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

SceneCommandPalette.displayName = 'scene-command-palette'
