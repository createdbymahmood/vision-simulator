import React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {Badge} from '@/components/ui/badge'
import {CAMERA_PRESETS} from '@/features/scene/domain/constants/camera-presets'

interface PlaceDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDevice: (presetId: string) => void
  nextColor: string
}

export const PlaceDeviceDialog: React.FC<PlaceDeviceDialogProps> = ({
  open,
  onOpenChange,
  onSelectDevice,
  nextColor,
}) => {
  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput placeholder='Place a device' />
      <CommandList>
        <CommandEmpty>No devices available</CommandEmpty>
        <CommandGroup heading='Devices'>
          {CAMERA_PRESETS.map((preset) => (
            <CommandItem
              key={preset.id}
              onSelect={() => {
                onSelectDevice(preset.id)
                onOpenChange(false)
              }}
            >
              <div className='flex w-full items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <span
                    aria-hidden
                    className='block size-2.5 rounded-full'
                    style={{backgroundColor: nextColor}}
                  />
                  <div className='flex flex-col'>
                    <span className='font-medium'>{preset.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {preset.description}
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Badge variant='outline'>FOV {preset.fov}°</Badge>
                  <Badge variant='outline'>Depth {preset.depth} m</Badge>
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
