import React from 'react'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {Slider} from '@/components/ui/slider'

import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

export const ShapePropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const shapes = useSceneStore((state) => state.scene.shapes)
  const updateScene = useSceneStore((state) => state.updateScene)

  const isOpen = openPanels['shape-properties'] ?? false
  const selectedShape = React.useMemo(() => {
    const shapeId = selectedEntityIds.find((id) => id.startsWith('shape-'))
    if (!shapeId) return null
    return shapes.find((shape) => shape.id === shapeId) ?? null
  }, [selectedEntityIds, shapes])

  const updateSelectedShape = React.useCallback(
    (updater: (shape: (typeof shapes)[number]) => void) => {
      if (!selectedShape) return
      updateScene((scene) => {
        const target = scene.shapes.find((shape) => shape.id === selectedShape.id)
        if (target) {
          updater(target)
        }
      })
    },
    [selectedShape, updateScene],
  )

  const handleColorChange = (value: string) => {
    updateSelectedShape((shape) => {
      shape.color = value
    })
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    updateSelectedShape((shape) => {
      shape.height = height
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('shape-properties') : closePanel('shape-properties')
      }
    >
      <SheetContent className='w-[360px] sm:w-[420px]' side='right'>
        <SheetHeader>
          <SheetTitle>Shape Properties</SheetTitle>
        </SheetHeader>

        {selectedShape ? (
          <div className='mt-6 space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='shape-color'>Color</Label>
              <Input
                id='shape-color'
                type='color'
                value={selectedShape.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Height ({selectedShape.height.toFixed(2)} m)</Label>
              <Slider
                max={10}
                min={0}
                step={0.1}
                value={[selectedShape.height]}
                onValueChange={handleHeightChange}
              />
            </div>
          </div>
        ) : (
          <p className='mt-6 text-sm text-muted-foreground'>
            Select a shape to edit its properties.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
