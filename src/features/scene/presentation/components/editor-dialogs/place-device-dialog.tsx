import React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface PlaceDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDevice: () => void
}

export const PlaceDeviceDialog: React.FC<PlaceDeviceDialogProps> = ({
  open,
  onOpenChange,
  onSelectDevice,
}) => {
  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput placeholder='Place a device' />
      <CommandList>
        <CommandEmpty>No devices available</CommandEmpty>
        <CommandGroup heading='Devices'>
          <CommandItem
            onSelect={() => {
              onSelectDevice()
              onOpenChange(false)
            }}
          >
            PTZ Camera
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onSelectDevice()
              onOpenChange(false)
            }}
          >
            Static Camera
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
