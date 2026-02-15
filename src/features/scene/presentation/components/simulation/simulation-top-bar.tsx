import {VideoRecorder} from '@untitledui/icons'
import {ArrowLeft, Camera} from 'lucide-react'
import React from 'react'

import type {PreviewViewMode} from '@/features/scene/domain/types'

import {Button} from '@/components/ui/button'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {cn} from '@/lib/utils'

interface SimulationTopBarProps {
  showBackButton?: boolean
  previewViewMode: PreviewViewMode
  allowPreviewViewSwitch?: boolean
  leftControls?: React.ReactNode
  isRecording: boolean
  recordingLabel: string
  onStartRecording: () => void
  onStopRecording: () => void
  onSnapshot: () => void
  onBackToEditor: () => void
  onPreviewViewModeChange: (mode: PreviewViewMode) => void
}

export const SimulationTopBar: React.FC<SimulationTopBarProps> = ({
  showBackButton = true,
  previewViewMode,
  allowPreviewViewSwitch = true,
  leftControls,
  isRecording,
  recordingLabel,
  onStartRecording,
  onStopRecording,
  onSnapshot,
  onBackToEditor,
  onPreviewViewModeChange,
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
        {leftControls ? (
          leftControls
        ) : allowPreviewViewSwitch ? (
          <ToggleGroup
            className='bg-background'
            type='single'
            value={previewViewMode}
            variant='outline'
            onValueChange={(value) => {
              if (value === '3d' || value === '2d') {
                onPreviewViewModeChange(value)
              }
            }}
          >
            <ToggleGroupItem
              aria-label='3D view'
              className='cursor-pointer'
              value='3d'
            >
              3D
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label='2D top-down view'
              className='cursor-pointer'
              value='2d'
            >
              2D
            </ToggleGroupItem>
          </ToggleGroup>
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
