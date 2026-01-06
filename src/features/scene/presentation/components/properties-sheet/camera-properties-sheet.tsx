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
import {InputGroup} from '@/components/ui/input-group'

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

  const updateSelectedCamera = React.useCallback(
    (updater: (camera: (typeof cameras)[number]) => void) => {
      if (!selectedCamera) return
      updateCamera(selectedCamera.id, updater)
    },
    [selectedCamera, updateCamera],
  )

  const handleColorChange = (value: string) => {
    updateSelectedCamera((camera) => {
      camera.color = value
    })
  }

  const handleDirectionChange = (values: number[]) => {
    const [direction] = values
    updateSelectedCamera((camera) => {
      camera.direction = direction
    })
  }

  const handleFovChange = (values: number[]) => {
    const [fov] = values
    updateSelectedCamera((camera) => {
      camera.fov = fov
    })
  }

  const handleDepthChange = (values: number[]) => {
    const [depth] = values
    updateSelectedCamera((camera) => {
      camera.depth = depth
    })
  }

  const handleZoomChange = (values: number[]) => {
    const [zoom] = values
    updateSelectedCamera((camera) => {
      camera.zoom = zoom
    })
  }

  const handleNearClipChange = (values: number[]) => {
    const [nearClipping] = values
    updateSelectedCamera((camera) => {
      camera.nearClipping = nearClipping
    })
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    updateSelectedCamera((camera) => {
      camera.height = height
    })
  }

  const handleResolutionChange = (key: 'width' | 'height', value: string) => {
    const next = Number.parseInt(value, 10)
    if (!Number.isFinite(next) || next <= 0) {
      return
    }
    updateSelectedCamera((camera) => {
      camera.resolution = {...camera.resolution, [key]: next}
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

            <div className='space-y-2'>
              <Label>Field of View ({selectedCamera.fov.toFixed(0)}°)</Label>
              <Slider
                max={180}
                min={10}
                step={1}
                value={[selectedCamera.fov]}
                onValueChange={handleFovChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Depth ({selectedCamera.depth.toFixed(1)} m)</Label>
              <Slider
                max={200}
                min={1}
                step={1}
                value={[selectedCamera.depth]}
                onValueChange={handleDepthChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Zoom ({selectedCamera.zoom.toFixed(1)}x)</Label>
              <Slider
                max={10}
                min={1}
                step={0.1}
                value={[selectedCamera.zoom]}
                onValueChange={handleZoomChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Near Clipping ({selectedCamera.nearClipping.toFixed(2)} m)</Label>
              <Slider
                max={5}
                min={0.1}
                step={0.1}
                value={[selectedCamera.nearClipping]}
                onValueChange={handleNearClipChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Height ({selectedCamera.height.toFixed(2)} m)</Label>
              <Slider
                max={20}
                min={0.5}
                step={0.1}
                value={[selectedCamera.height]}
                onValueChange={handleHeightChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Resolution</Label>
              <InputGroup>
                <Input
                  type='number'
                  min={1}
                  value={selectedCamera.resolution.width}
                  onChange={(event) =>
                    handleResolutionChange('width', event.target.value)
                  }
                  aria-label='Resolution width'
                />
                <div className='px-2 text-sm text-muted-foreground'>×</div>
                <Input
                  type='number'
                  min={1}
                  value={selectedCamera.resolution.height}
                  onChange={(event) =>
                    handleResolutionChange('height', event.target.value)
                  }
                  aria-label='Resolution height'
                />
              </InputGroup>
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
