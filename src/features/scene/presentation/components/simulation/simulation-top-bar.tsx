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
        <div className='inline-flex items-center gap-1 rounded-full bg-muted'>
          <Button
            size='sm'
            className='rounded-full'
            variant={sceneMode === 'map' ? 'default' : 'ghost'}
            onClick={() => onSceneModeChange('map')}
          >
            <Map className='mr-2 h-4 w-4' />
            Map
          </Button>
          <Button
            size='sm'
            className='rounded-full'
            variant={sceneMode === 'canvas' ? 'default' : 'ghost'}
            onClick={() => onSceneModeChange('canvas')}
          >
            <ToggleLeft className='mr-2 h-4 w-4' />
            Canvas
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        {hasMultipleAreas ? (
          <Select value={activeAreaId} onValueChange={onAreaChange}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='All Areas' />
            </SelectTrigger>
            <SelectContent align='center'>
              <SelectItem value='all'>All Areas</SelectItem>
              <div className='my-1 h-px bg-border' />
              {areaOptions.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  <div className='flex items-center gap-2'>
                    <span
                      className='inline-block size-2.5 rounded-full'
                      style={{
                        backgroundColor:
                          area.id === activeAreaId ? '#0EA5E9' : '#9CA3AF',
                      }}
                    />
                    {area.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <MapPin className='h-4 w-4' />
            {areaOptions[0]?.label ?? 'All Areas'}
          </div>
        )}
      </div>

      <div className='flex items-center gap-2 ml-auto'>
        {isRecording ? (
          <div className='flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 tabular-nums'>
            <span className='recording-dot size-2 rounded-full bg-red-500' />
            {recordingLabel}
          </div>
        ) : null}

        <Button
          size='sm'
          className={cn(isRecording ? 'recording-button' : '')}
          variant={isRecording ? 'destructive' : 'outline'}
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          <Film className='mr-2 h-4 w-4' />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        <Button size='sm' variant='outline' onClick={onSnapshot}>
          <Camera className='mr-2 h-4 w-4' />
          Snapshot
        </Button>
      </div>

      <Button size='sm' variant='outline' onClick={onBackToEditor}>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Editor
      </Button>
    </div>
  )
}
