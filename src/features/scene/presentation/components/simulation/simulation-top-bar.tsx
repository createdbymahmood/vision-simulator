import {VideoRecorder} from '@untitledui/icons'
import {ArrowLeft, Camera, Film, Map, MapPin, ToggleLeft} from 'lucide-react'
import React from 'react'

import type {SceneMode} from '@/features/scene/domain/types'

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
  sceneMode: SceneMode
  areaOptions: SimulationAreaOption[]
  activeAreaId: string
  isRecording: boolean
  recordingLabel: string
  onSceneModeChange: (mode: SceneMode) => void
  onAreaChange: (value: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onSnapshot: () => void
  onBackToEditor: () => void
}

export const SimulationTopBar: React.FC<SimulationTopBarProps> = ({
  sceneMode,
  areaOptions,
  activeAreaId,
  isRecording,
  recordingLabel,
  onSceneModeChange,
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
            variant={sceneMode === 'map' ? 'default' : 'ghost'}
            onClick={() => onSceneModeChange('map')}
          >
            <Map className='mr-2 size-5' />
            Map
          </Button>
          <Button
            className='rounded-full h-8'
            variant={sceneMode === 'canvas' ? 'default' : 'ghost'}
            onClick={() => onSceneModeChange('canvas')}
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
