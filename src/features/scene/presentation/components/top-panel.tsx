import {
  Download,
  Grid,
  Map,
  Play,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'
import React from 'react'

import type {SceneMode, ViewMode} from '@/features/scene/domain/types'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Switch} from '@/components/ui/switch'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

interface TopPanelProps {
  sceneMode: SceneMode
  viewMode: ViewMode
  isEditMode: boolean
  canUndo: boolean
  canRedo: boolean
  lastActionDescription?: string
  onSceneModeChange: (mode: SceneMode) => void
  onTogglePreview: () => void
  onEditModeChange: (enabled: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onClearBoard: () => void
}

export const TopPanel: React.FC<TopPanelProps> = ({
  sceneMode,
  viewMode,
  isEditMode,
  canUndo,
  canRedo,
  lastActionDescription,
  onSceneModeChange,
  onTogglePreview,
  onEditModeChange,
  onUndo,
  onRedo,
  onClearBoard,
}) => {
  return (
    <div className='fixed left-0 right-0 top-0 z-40 h-14 border-b backdrop-blur'>
      <div className='mx-auto flex h-full items-center justify-between px-4'>
        <div className='flex items-center gap-3'>
          <Badge className='uppercase' variant='secondary'>
            Editor
          </Badge>
          <ToggleGroup
            className='border shadow-sm transition duration-200 '
            type='single'
            value={sceneMode}
            onValueChange={(value) => {
              if (value) {
                onSceneModeChange(value as SceneMode)
              }
            }}
          >
            <ToggleGroupItem
              aria-label='Map Mode'
              className='gap-2 transition duration-200'
              value='map'
            >
              <Map className='h-4 w-4' />
              Map
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label='Canvas Mode'
              className='gap-2 transition duration-200'
              value='canvas'
            >
              <Grid className='h-4 w-4' />
              Canvas
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Switch
              checked={isEditMode}
              id='edit-mode'
              onCheckedChange={onEditModeChange}
            />
            <label className='text-sm font-medium' htmlFor='edit-mode'>
              Edit Mode
            </label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size='sm' disabled={!isEditMode} variant='outline'>
                <Trash2 className='h-4 w-4' />
                Clear Board
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear the board?</AlertDialogTitle>
                <AlertDialogDescription>
                  This resets the scene to an empty state. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearBoard}>
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className='flex items-center gap-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  aria-label='Undo'
                  disabled={!canUndo || !isEditMode}
                  variant='outline'
                  onClick={onUndo}
                >
                  <RotateCcw className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Undo {lastActionDescription ? `(${lastActionDescription})` : ''}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  aria-label='Redo'
                  disabled={!canRedo || !isEditMode}
                  variant='outline'
                  onClick={onRedo}
                >
                  <RotateCw className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Redo {lastActionDescription ? `(${lastActionDescription})` : ''}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <Download className='h-4 w-4' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Scene JSON</DropdownMenuItem>
              <DropdownMenuItem>Scene Image</DropdownMenuItem>
              <DropdownMenuItem disabled>Bundle (soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size='sm' onClick={onTogglePreview}>
            <Play className='h-4 w-4' />
            {viewMode === 'preview' ? 'Back to Editor' : 'Live Preview'}
          </Button>
        </div>
      </div>
    </div>
  )
}
