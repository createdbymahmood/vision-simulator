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
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'

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
      <SheetContent className='vs:w-[360px] vs:sm:w-[400px]' side='right'>
        <SheetHeader>
          <SheetTitle>Devices in use</SheetTitle>
          <SheetDescription>
            Quick glance at cameras placed in the scene.
          </SheetDescription>
        </SheetHeader>
        <div className='vs:mt-4 vs:space-y-4'>
          <div className='vs:flex vs:items-center vs:justify-between vs:rounded-lg vs:border vs:px-3 vs:py-2'>
            <div className='vs:flex vs:items-center vs:gap-2 vs:text-sm vs:text-muted-foreground'>
              <span>Cameras</span>
            </div>
            <Badge variant='secondary'>{deviceCount}</Badge>
          </div>

          <div className='vs:space-y-2'>
            {cameras.length === 0 ? (
              <p className='vs:text-sm vs:text-muted-foreground'>
                No cameras placed yet.
              </p>
            ) : (
              cameras.map((camera) => (
                <button
                  className='vs:flex vs:w-full vs:items-center vs:justify-between vs:rounded-lg vs:border vs:px-3 vs:py-2 vs:text-left vs:transition vs:hover:bg-muted/60'
                  key={camera.id}
                  type='button'
                  onClick={() => handleSelectCamera(camera.id)}
                >
                  <div className='vs:flex vs:items-center vs:gap-3'>
                    <Avatar className='vs:h-8 vs:w-8 vs:border'>
                      <AvatarFallback style={{backgroundColor: camera.color}} />
                    </Avatar>
                    <div className='vs:flex vs:flex-col'>
                      <span className='vs:font-medium'>
                        {camera.sourceDeviceName || camera.name}
                      </span>
                      <span className='vs:text-xs vs:text-muted-foreground'>
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
