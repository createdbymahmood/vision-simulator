import {VideoRecorder} from '@untitledui/icons'
import {ArrowLeft, Camera, Film, Map, MapPin, ToggleLeft} from 'lucide-react'
import React from 'react'

import type {EditorMode} from '@/features/scene/domain/types'

import {Button} from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {cn} from '@/lib/utils'

export interface SimulationAreaOption {
  id: string
  label: string
  objects: number
}

interface SimulationTopBarProps {
  editorMode: EditorMode
  areaOptions: SimulationAreaOption[]
  activeAreaId: string
  isRecording: boolean
  recordingLabel: string
  onEditorModeChange: (mode: EditorMode) => void
  onAreaChange: (value: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onSnapshot: () => void
  onBackToEditor: () => void
}

export const SimulationTopBar: React.FC<SimulationTopBarProps> = ({
  editorMode,
  areaOptions,
  activeAreaId,
  isRecording,
  recordingLabel,
  onEditorModeChange,
  onAreaChange,
  onStartRecording,
  onStopRecording,
  onSnapshot,
  onBackToEditor,
}) => {
  const hasMultipleAreas = areaOptions.length > 1

  return (
    <div className='flex h-14 items-center bg-background/80 backdrop-blur px-4 border-b gap-2'>
      <div className='flex items-center gap-4'>
        <Button
          size='icon'
          aria-label='Back'
          variant='ghost'
          onClick={onBackToEditor}
        >
          <ArrowLeft className='size-5' />
        </Button>

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
