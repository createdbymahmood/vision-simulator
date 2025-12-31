import {DownloadIcon, RadioIcon, XIcon} from 'lucide-react'
import React from 'react'

import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Switch} from '@/components/ui/switch'

interface SimulationTopBarProps {
  recording: boolean
  onToggleRecording: (next: boolean) => void
  onExportSnapshot: (scale: number) => void
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

  const handleExportSnapshot = (scale: number) => {
    onExportSnapshot(scale)
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
        {recording ? (
          <span className='text-sm font-semibold text-red-500'>Recording…</span>
        ) : null}
      </div>
      <div className='flex items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' variant='outline'>
              <DownloadIcon className='mr-2 size-4' />
              Export Snapshot
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuItem onSelect={() => handleExportSnapshot(1)}>
              PNG (1x)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExportSnapshot(2)}>
              PNG (2x)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size='sm' variant='ghost' onClick={onClose}>
          <XIcon className='mr-2 size-4' />
          Close
        </Button>
      </div>
    </div>
  )
}

SimulationTopBar.displayName = 'simulation-top-bar'
