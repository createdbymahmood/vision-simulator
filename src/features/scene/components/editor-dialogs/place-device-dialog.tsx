import React from 'react'

import type {CameraPlacementProfile} from '@/features/scene/types/types'

import {Badge} from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import {getVirtualPlaceDeviceOptions} from './place-dialog-devices'

interface PlaceDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDevice: (profile: CameraPlacementProfile) => void
  nextColor: string
}

interface PlaceDeviceDialogListProps {
  onOpenChange: (open: boolean) => void
  onSelectDevice: (profile: CameraPlacementProfile) => void
  nextColor: string
}

const PlaceDeviceDialogList: React.FC<PlaceDeviceDialogListProps> = ({
  onOpenChange,
  onSelectDevice,
  nextColor,
}) => {
  const virtualDevices = React.useMemo(() => getVirtualPlaceDeviceOptions(), [])

  const renderDevice = (
    device: ReturnType<typeof getVirtualPlaceDeviceOptions>[number],
  ) => (
    <CommandItem
      key={device.id}
      onSelect={() => {
        onSelectDevice(device.profile)
        onOpenChange(false)
      }}
    >
      <div className='vs:flex vs:w-full vs:items-center vs:justify-between vs:gap-3'>
        <div className='vs:flex vs:items-center vs:gap-3'>
          <span
            aria-hidden
            className='vs:block vs:size-2.5 vs:rounded-full'
            style={{backgroundColor: nextColor}}
          />
          <div className='vs:flex vs:flex-col'>
            <span className='vs:font-medium'>{device.name}</span>
            <span className='vs:max-w-[420px] vs:overflow-hidden vs:text-ellipsis vs:whitespace-nowrap vs:text-xs vs:text-muted-foreground'>
              {device.description}
            </span>
          </div>
        </div>
        <div className='vs:flex vs:items-center vs:gap-2 vs:text-xs vs:text-muted-foreground'>
          <Badge variant='outline'>
            HFOV {device.fovHorizontal.toFixed(0)}°
          </Badge>
          <Badge variant='outline'>VFOV {device.fovVertical.toFixed(0)}°</Badge>
          <Badge variant='outline'>Depth {device.depth} m</Badge>
        </div>
      </div>
    </CommandItem>
  )

  return (
    <CommandList>
      <CommandEmpty>No devices available</CommandEmpty>
      <CommandGroup className='vs:pb-2' heading='Virtual Devices'>
        {virtualDevices.map(renderDevice)}
      </CommandGroup>
    </CommandList>
  )
}

export const PlaceDeviceDialog: React.FC<PlaceDeviceDialogProps> = ({
  open,
  onOpenChange,
  onSelectDevice,
  nextColor,
}) => {
  return (
    <CommandDialog
      className='vs:sm:max-w-[580px]'
      onOpenChange={onOpenChange}
      open={open}
    >
      <CommandInput placeholder='Place a device' />
      {open ? (
        <React.Suspense
          fallback={
            <CommandList>
              <CommandEmpty>Loading devices...</CommandEmpty>
            </CommandList>
          }
        >
          <PlaceDeviceDialogList
            nextColor={nextColor}
            onOpenChange={onOpenChange}
            onSelectDevice={onSelectDevice}
          />
        </React.Suspense>
      ) : null}
    </CommandDialog>
  )
}
