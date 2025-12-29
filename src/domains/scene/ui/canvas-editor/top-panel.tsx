import {
  DownloadIcon,
  EraserIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from 'lucide-react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'

export function CanvasTopPanel({
  autosaveLabel,
  editMode,
  snapEnabled,
  onToggleEditMode,
  onToggleSnap,
  onClearBoard,
  onUndo,
  onRedo,
  onExport,
  canUndo,
  canRedo,
  onLivePreview,
}: {
  autosaveLabel: string
  editMode: boolean
  snapEnabled: boolean
  canUndo: boolean
  canRedo: boolean
  onToggleEditMode: (next: boolean) => void
  onToggleSnap: (next: boolean) => void
  onClearBoard: () => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onLivePreview: () => void
}) {
  return (
    <div className='z-20 flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur'>
      <div className='flex items-center gap-2'>
        <Badge variant='outline'>Canvas Editor</Badge>
        <Badge>Top Panel</Badge>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {autosaveLabel}
        </span>
      </div>

      <div className='flex items-center gap-2 mr-auto'>
        <Switch
          checked={editMode}
          id='edit-mode'
          onCheckedChange={onToggleEditMode}
        />
        <label className='text-sm' htmlFor='edit-mode'>
          Edit mode
        </label>
      </div>
      <div className='flex items-center gap-2'>
        <Switch
          checked={snapEnabled}
          id='snap-grid'
          onCheckedChange={onToggleSnap}
        />
        <label className='text-sm' htmlFor='snap-grid'>
          Snap to grid
        </label>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button size='sm' variant='outline' onClick={onClearBoard}>
          <EraserIcon className='mr-2 size-4' />
          Clear board
        </Button>
        <Button
          size='sm'
          disabled={!canUndo}
          variant='outline'
          onClick={onUndo}
        >
          <UndoIcon className='mr-2 size-4' />
          Undo
        </Button>
        <Button
          size='sm'
          disabled={!canRedo}
          variant='outline'
          onClick={onRedo}
        >
          <RedoIcon className='mr-2 size-4' />
          Redo
        </Button>
        <Button size='sm' variant='outline' onClick={onExport}>
          <DownloadIcon className='mr-2 size-4' />
          Export
        </Button>
        <Button size='sm' variant='default' onClick={onLivePreview}>
          <PlayIcon className='mr-2 size-4' />
          Live Preview
        </Button>
      </div>
    </div>
  )
}
