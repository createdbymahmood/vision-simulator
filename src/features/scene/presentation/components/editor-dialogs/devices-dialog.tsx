import React from 'react'

import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {Badge} from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

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
  const cameras = useSceneStore((state) => state.scene.cameras)
  const setSelection = useSceneStore((state) => state.setSelection)
  const setActiveTool = useUiStore((state) => state.setActiveTool)
  const openPanel = useUiStore((state) => state.openPanel)

  const handleSelectCamera = (cameraId: string) => {
    setSelection([cameraId])
    setActiveTool('select')
    openPanel('camera-properties')
    onOpenChange(true)
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className='w-[360px] sm:w-[400px]' side='right'>
        <SheetHeader>
          <SheetTitle>Devices in use</SheetTitle>
          <SheetDescription>
            Quick glance at cameras placed in the scene.
          </SheetDescription>
        </SheetHeader>
        <div className='mt-4 space-y-4'>
          <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>Cameras</span>
            </div>
            <Badge variant='secondary'>{deviceCount}</Badge>
          </div>

          <div className='space-y-2'>
            {cameras.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No cameras placed yet.
              </p>
            ) : (
              cameras.map((camera) => (
                <button
                  className='flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:bg-muted/60'
                  key={camera.id}
                  type='button'
                  onClick={() => handleSelectCamera(camera.id)}
                >
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8 border'>
                      <AvatarFallback style={{backgroundColor: camera.color}} />
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {camera.sourceDeviceName || camera.name}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        HFOV {camera.fovHorizontal.toFixed(0)}° • VFOV{' '}
                        {camera.fovVertical.toFixed(0)}° • Depth {camera.depth}{' '}
                        m
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
