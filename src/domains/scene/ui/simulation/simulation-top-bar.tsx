import {DownloadIcon, RadioIcon, XIcon} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'

interface SimulationTopBarProps {
  recording: boolean
  onToggleRecording: (next: boolean) => void
  onExportSnapshot: () => void
  onClose: () => void
}

export const SimulationTopBar: React.FC<SimulationTopBarProps> = ({
  recording,
  onToggleRecording,
  onExportSnapshot,
  onClose,
}) => {
  const handleRecordingChange = (next: boolean) => {
    onToggleRecording(next)
  }

  return (
    <div className='flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur'>
      <div className='flex items-center gap-2'>
        <RadioIcon className='size-4 text-muted-foreground' />
        <Switch
          checked={recording}
          id='start-recording'
          onCheckedChange={handleRecordingChange}
        />
        <label className='text-sm' htmlFor='start-recording'>
          Start Recording
        </label>
      </div>
      <div className='flex items-center gap-2'>
        <Button size='sm' variant='outline' onClick={onExportSnapshot}>
          <DownloadIcon className='mr-2 size-4' />
          Export Snapshot
        </Button>
        <Button size='sm' variant='ghost' onClick={onClose}>
          <XIcon className='mr-2 size-4' />
          Close
        </Button>
      </div>
    </div>
  )
}

SimulationTopBar.displayName = 'simulation-top-bar'
