import React from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Separator} from '@/components/ui/separator'

interface SearchLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenMapStyles: () => void
}

export const SearchLocationDialog: React.FC<SearchLocationDialogProps> = ({
  open,
  onOpenChange,
  onOpenMapStyles,
}) => {
  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <CommandInput placeholder='Search location...' />
      <CommandList>
        <CommandEmpty>No locations found.</CommandEmpty>
        <CommandGroup heading='Shortcuts'>
          <CommandItem onSelect={onOpenMapStyles}>
            Adjust map style
            <CommandShortcut>⌘M</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

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

interface AreaManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  areaCount: number
}

export const AreaManagementDialog: React.FC<AreaManagementDialogProps> = ({
  open,
  onOpenChange,
  areaCount,
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Areas</DialogTitle>
          <DialogDescription>
            Create and manage areas before using dependent tools.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
            <span className='text-sm text-muted-foreground'>Total areas</span>
            <span className='text-sm font-semibold'>{areaCount}</span>
          </div>
          <Separator />
          <p className='text-sm text-muted-foreground'>
            Add areas in the bottom navigation to unlock walls, shapes, and
            device placement.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DevicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceCount: number
}

export const DevicesDialog: React.FC<DevicesDialogProps> = ({
  open,
  onOpenChange,
  deviceCount,
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devices in use</DialogTitle>
          <DialogDescription>
            Quick glance at cameras placed in the scene.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
            <span className='text-sm text-muted-foreground'>Cameras</span>
            <span className='text-sm font-semibold'>{deviceCount}</span>
          </div>
          <p className='text-sm text-muted-foreground'>
            Device details will appear here in the next phase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MapStyleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MapStyleDialog: React.FC<MapStyleDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map view</DialogTitle>
          <DialogDescription>
            Toggle between available map styles.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          {['street', 'satellite', 'traffic', 'osm'].map((style) => (
            <div
              className='flex items-center justify-between rounded-lg border px-3 py-2'
              key={style}
            >
              <span className='capitalize'>{style}</span>
              <span className='text-xs text-muted-foreground'>Coming soon</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
