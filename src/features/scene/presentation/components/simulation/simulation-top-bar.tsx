import {VideoRecorder} from '@untitledui/icons'
import {ArrowLeft, Camera, Eye, EyeOff} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'
import {cn} from '@/lib/utils'

interface SimulationTopBarProps {
  showBackButton?: boolean
  isRecording: boolean
  recordingLabel: string
  onStartRecording: () => void
  onStopRecording: () => void
  onSnapshot: () => void
  onBackToEditor: () => void
  showFovCollisions: boolean
  onShowFovCollisionsChange: (enabled: boolean) => void
}

export const SimulationTopBar: React.FC<SimulationTopBarProps> = ({
  showBackButton = true,
  isRecording,
  recordingLabel,
  onStartRecording,
  onStopRecording,
  onSnapshot,
  onBackToEditor,
  showFovCollisions,
  onShowFovCollisionsChange,
}) => {
  return (
    <div className='flex h-14 items-center bg-background/80 backdrop-blur px-4 border-b gap-2'>
      <div className='flex items-center gap-4'>
        {showBackButton ? (
          <Button
            size='icon'
            aria-label='Back'
            variant='ghost'
            onClick={onBackToEditor}
          >
            <ArrowLeft className='size-5' />
          </Button>
        ) : null}

        {/* This is a very important code that should not be removed */}
        {/* <div className='inline-flex items-center gap-1 rounded-full bg-muted'>
          <Button
            className='rounded-full h-8'
            variant={editorMode === 'map' ? 'default' : 'ghost'}
            onClick={() => onEditorModeChange('map')}
          >
            <Map className='mr-2 size-5' />
            Map
          </Button>
          <Button
            className='rounded-full h-8'
            variant={editorMode === 'canvas' ? 'default' : 'ghost'}
            onClick={() => onEditorModeChange('canvas')}
          >
            <ToggleLeft className='mr-2 size-5' />
            Canvas
          </Button>
        </div> */}
      </div>

      <div className='flex items-center gap-2 ml-auto'>
        <div className='flex items-center gap-2 rounded-full border px-3 py-1'>
          {showFovCollisions ? (
            <Eye className='size-4 text-muted-foreground' />
          ) : (
            <EyeOff className='size-4 text-muted-foreground' />
          )}
          <Switch
            checked={showFovCollisions}
            id='show-fov-collisions'
            onCheckedChange={onShowFovCollisionsChange}
          />
          <label
            className='text-xs font-medium text-muted-foreground'
            htmlFor='show-fov-collisions'
          >
            FOV Collisions
          </label>
        </div>

        {isRecording ? (
          <div className='flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 tabular-nums'>
            <span className='recording-dot size-2 rounded-full bg-red-500' />
            {recordingLabel}
          </div>
        ) : null}

        <Button
          className={cn(isRecording ? 'recording-button' : '')}
          variant={isRecording ? 'destructive' : 'outline'}
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          <VideoRecorder className='size-5' />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        <Button variant='outline' onClick={onSnapshot}>
          <Camera className='size-5' />
          Export Snapshot
        </Button>
      </div>
    </div>
  )
}
