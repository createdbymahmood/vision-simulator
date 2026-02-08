import {Eraser, FlipBackward, FlipForward, Share01} from '@untitledui/icons'
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

import type {EditorMode} from '@/features/scene/domain/types'

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
  editorMode: EditorMode
  isEditMode: boolean
  canUndo: boolean
  canRedo: boolean
  lastUndoDescription?: string
  lastRedoDescription?: string
  onBack: () => void
  onEditorModeChange: (mode: EditorMode) => void
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
  editorMode,
  isEditMode,
  canUndo,
  canRedo,
  lastUndoDescription,
  lastRedoDescription,
  onBack,
  onEditorModeChange,
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
            <ArrowLeft className='size-5' />
          </Button>

          <span className='text-xl font-semibold'>Project name</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' aria-label='More options' variant='ghost'>
                <MoreHorizontal className='size-5' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuLabel>Scene mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={editorMode === 'map'}
                onSelect={() => onEditorModeChange('map')}
              >
                Map mode
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={editorMode === 'canvas'}
                onSelect={() => onEditorModeChange('canvas')}
              >
                Canvas mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='flex items-center gap-3'>
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
                variant='ghost'
              >
                <Eraser className='size-5' />
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
                  variant='ghost'
                  onClick={onUndo}
                >
                  <FlipBackward className='size-5' />
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
                  variant='ghost'
                  onClick={onRedo}
                >
                  <FlipForward className='size-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Redo{lastRedoDescription ? ` (${lastRedoDescription})` : ''}
              </TooltipContent>
            </Tooltip>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='outline'>
                <Share01 className='size-5' />
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

          <Button variant='outline' onClick={onTogglePreview}>
            <Play className='size-5' />
            Live preview
          </Button>
        </div>
      </div>
    </div>
  )
}
