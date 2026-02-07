import {
  ArrowLeft,
  MoreHorizontal,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  Trash2,
} from 'lucide-react'
import React from 'react'

import type {SceneMode} from '@/features/scene/domain/types'

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
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

interface TopPanelProps {
  sceneMode: SceneMode
  isEditMode: boolean
  canUndo: boolean
  canRedo: boolean
  lastUndoDescription?: string
  lastRedoDescription?: string
  onBack: () => void
  onSceneModeChange: (mode: SceneMode) => void
  onTogglePreview: () => void
  onEditModeChange: (enabled: boolean) => void
  onUndo: () => void
  onRedo: () => void
  onClearBoard: () => void
  onExportSceneJson: () => void
  onExportSceneImage: () => void
}

// eslint-disable-next-line max-lines-per-function
export const TopPanel: React.FC<TopPanelProps> = ({
  sceneMode,
  isEditMode,
  canUndo,
  canRedo,
  lastUndoDescription,
  lastRedoDescription,
  onBack,
  onSceneModeChange,
  onTogglePreview,
  onEditModeChange,
  onUndo,
  onRedo,
  onClearBoard,
  onExportSceneJson,
  onExportSceneImage,
}) => {
  return (
    <div className='fixed left-0 right-0 top-0 z-40 h-14 border-b backdrop-blur'>
      <div className='mx-auto flex h-full items-center justify-between px-4'>
        <div className='flex items-center gap-3'>
          <Button
            size='icon'
            aria-label='Back'
            variant='ghost'
            onClick={onBack}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Badge className='uppercase' variant='secondary'>
            Project name
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' aria-label='More options' variant='ghost'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuLabel>Scene mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={sceneMode === 'map'}
                onSelect={() => onSceneModeChange('map')}
              >
                Map mode
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={sceneMode === 'canvas'}
                onSelect={() => onSceneModeChange('canvas')}
              >
                Canvas mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Switch
              checked={isEditMode}
              id='edit-mode'
              onCheckedChange={onEditModeChange}
            />
            <label className='text-sm font-medium' htmlFor='edit-mode'>
              Edit mode
            </label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size='icon'
                aria-label='Clear board'
                disabled={!isEditMode}
                variant='outline'
              >
                <Trash2 className='h-4 w-4' />
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
                Undo{lastUndoDescription ? ` (${lastUndoDescription})` : ''}
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
                Redo{lastRedoDescription ? ` (${lastRedoDescription})` : ''}
              </TooltipContent>
            </Tooltip>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <Share2 className='h-4 w-4' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onExportSceneJson}>
                Scene JSON
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportSceneImage}>
                Scene Image
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Bundle (soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size='sm' onClick={onTogglePreview}>
            <Play className='h-4 w-4' />
            Live preview
          </Button>
        </div>
      </div>
    </div>
  )
}
