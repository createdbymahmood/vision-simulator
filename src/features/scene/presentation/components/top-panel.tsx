import {Eraser, FlipBackward, FlipForward, Share01} from '@untitledui/icons'
import {ArrowLeft, MoreHorizontal, Play, Save} from 'lucide-react'
import React from 'react'

import type {EditorMode} from '@/features/scene/domain/types'
import type {EditorTopPanelUiOverrides} from '@/features/scene/presentation/types/editor-ui-overrides'

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
  projectName: string
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
  onSave: () => void
  saveLoading: boolean
  onExportSceneJson: () => void
  onExportSceneImage: () => void
  uiOverrides?: EditorTopPanelUiOverrides
}

// eslint-disable-next-line max-lines-per-function
export const TopPanel: React.FC<TopPanelProps> = ({
  projectName,
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
  onSave,
  saveLoading,
  onExportSceneJson,
  onExportSceneImage,
  uiOverrides,
}) => {
  const defaultBackButton = (
    <Button size='icon' aria-label='Back' variant='ghost' onClick={onBack}>
      <ArrowLeft className='vs:size-5' />
    </Button>
  )
  const renderBackButton = uiOverrides?.slots?.backButton
  const backButton = renderBackButton
    ? renderBackButton({
        defaultButton: defaultBackButton,
        editorMode,
        isEditMode,
        onBack,
        projectName,
      })
    : defaultBackButton

  return (
    <div className='vs:fixed vs:left-0 vs:right-0 vs:top-0 vs:z-40 vs:h-14 vs:border-b vs:backdrop-blur'>
      <div className='vs:mx-auto vs:flex vs:h-full vs:items-center vs:justify-between vs:px-4'>
        <div className='vs:flex vs:items-center vs:gap-3'>
          {backButton}

          <span className='vs:text-xl vs:font-semibold'>{projectName}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' aria-label='More options' variant='ghost'>
                <MoreHorizontal className='vs:size-5' />
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

        <div className='vs:flex vs:items-center vs:gap-3'>
          <div className='vs:flex vs:items-center vs:gap-2'>
            <Switch
              checked={isEditMode}
              id='edit-mode'
              onCheckedChange={onEditModeChange}
            />
            <label className='vs:text-sm vs:font-medium' htmlFor='edit-mode'>
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
                <Eraser className='vs:size-5' />
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
                <AlertDialogAction variant='destructive' onClick={onClearBoard}>
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className='vs:flex vs:items-center vs:gap-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  aria-label='Undo'
                  disabled={!canUndo || !isEditMode}
                  variant='ghost'
                  onClick={onUndo}
                >
                  <FlipBackward className='vs:size-5' />
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
                  <FlipForward className='vs:size-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Redo{lastRedoDescription ? ` (${lastRedoDescription})` : ''}
              </TooltipContent>
            </Tooltip>
          </div>

          <Button
            size='icon'
            variant='outline'
            loading={saveLoading}
            onClick={onSave}
          >
            <Save className='vs:size-5' />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='outline'>
                <Share01 className='vs:size-5' />
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
            <Play className='vs:size-5' />
            Live preview
          </Button>
        </div>
      </div>
    </div>
  )
}
