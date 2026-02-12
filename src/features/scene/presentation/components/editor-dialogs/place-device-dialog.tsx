import React from 'react'

import type {DevicePopulate} from '@/data-provider/api/services/v2/api.schemas'
import type {CameraPlacementProfile} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {DeviceUpdateDtoType} from '@/data-provider/api/services/v2/api.schemas'
import {useGetAllDevicesSuspense} from '@/data-provider/api/services/v2/device'
import {createCameraPlacementProfileFromDevice} from '@/features/scene/presentation/utils/camera-device-features'
import {get} from '@/lib/lodash-es'

interface PlaceDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDevice: (profile: CameraPlacementProfile) => void
  nextColor: string
}

interface PlaceableDeviceOption {
  id: string
  name: string
  description: string
  profile: CameraPlacementProfile
  fovHorizontal: number
  fovVertical: number
  depth: number
}

export const DEFAULT_LIST_PARAMS_V2 = {
  page: 1,
  limit: Number.MAX_SAFE_INTEGER,
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
  const {data: devices} = useGetAllDevicesSuspense(DEFAULT_LIST_PARAMS_V2, {
    query: {
      select: (s) =>
        (get(s, 'List') as unknown as DevicePopulate[] | undefined) ?? [],
    },
  })

  const placeableDevices = React.useMemo<PlaceableDeviceOption[]>(
    () =>
      devices
        .filter((device) => device.type === DeviceUpdateDtoType.ipCamera)
        .map((device, index) => {
          const profile = createCameraPlacementProfileFromDevice(device)
          return {
            id: device.id ?? device.deviceId ?? `ip-camera-${index}`,
            name: device.name ?? device.deviceId ?? `IP Camera ${index + 1}`,
            description: device.description ?? 'IP camera',
            profile,
            fovHorizontal: profile.optics.fovHorizontal,
            fovVertical: profile.optics.fovVertical,
            depth: profile.optics.depth,
          }
        }),
    [devices],
  )

  return (
    <CommandList>
      <CommandEmpty>No IP cameras available</CommandEmpty>
      <CommandGroup className='pb-2' heading='Devices'>
        {placeableDevices.map((device) => (
          <CommandItem
            key={device.id}
            onSelect={() => {
              onSelectDevice(device.profile)
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
                  <span className='font-medium'>{device.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    {device.description}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Badge variant='outline'>
                  HFOV {device.fovHorizontal.toFixed(0)}°
                </Badge>
                <Badge variant='outline'>
                  VFOV {device.fovVertical.toFixed(0)}°
                </Badge>
                <Badge variant='outline'>Depth {device.depth} m</Badge>
              </div>
            </div>
          </CommandItem>
        ))}
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
    <CommandDialog onOpenChange={onOpenChange} open={open}>
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
