import React from 'react'

import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {Slider} from '@/components/ui/slider'

import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

export const CameraPropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const cameras = useSceneStore((state) => state.scene.cameras)
  const updateCamera = useSceneStore((state) => state.updateCamera)

  const isOpen = openPanels['camera-properties'] ?? false
  const selectedCamera = React.useMemo(() => {
    const cameraId = selectedEntityIds.find((id) => id.startsWith('camera-'))
    if (!cameraId) return null
    return cameras.find((camera) => camera.id === cameraId) ?? null
  }, [cameras, selectedEntityIds])

  const handleColorChange = (value: string) => {
    if (!selectedCamera) return
    updateCamera(selectedCamera.id, (camera) => {
      camera.color = value
    })
  }

  const handleDirectionChange = (values: number[]) => {
    if (!selectedCamera) return
    const [direction] = values
    updateCamera(selectedCamera.id, (camera) => {
      camera.direction = direction
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('camera-properties') : closePanel('camera-properties')
      }
    >
      <SheetContent className='w-[360px] sm:w-[420px]' side='right'>
        <SheetHeader>
          <SheetTitle>Camera Properties</SheetTitle>
        </SheetHeader>

        {selectedCamera ? (
          <div className='mt-6 space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='camera-name'>Name</Label>
              <div className='rounded-md border px-3 py-2 text-sm'>
                {selectedCamera.typePreset}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='camera-color'>Color</Label>
              <Input
                id='camera-color'
                type='color'
                value={selectedCamera.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Direction ({selectedCamera.direction.toFixed(0)}°)</Label>
              <Slider
                max={360}
                min={0}
                step={1}
                value={[selectedCamera.direction]}
                onValueChange={handleDirectionChange}
              />
            </div>
          </div>
        ) : (
          <p className='mt-6 text-sm text-muted-foreground'>
            Select a camera to edit its properties.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
