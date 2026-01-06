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

export const WallPropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const walls = useSceneStore((state) => state.scene.walls)
  const updateScene = useSceneStore((state) => state.updateScene)

  const isOpen = openPanels['wall-properties'] ?? false
  const selectedWall = React.useMemo(() => {
    const wallId = selectedEntityIds.find((id) => id.startsWith('wall-'))
    if (!wallId) return null
    return walls.find((wall) => wall.id === wallId) ?? null
  }, [selectedEntityIds, walls])

  const updateSelectedWall = React.useCallback(
    (updater: (wall: (typeof walls)[number]) => void) => {
      if (!selectedWall) return
      updateScene((scene) => {
        const target = scene.walls.find((wall) => wall.id === selectedWall.id)
        if (target) {
          updater(target)
        }
      })
    },
    [selectedWall, updateScene],
  )

  const handleColorChange = (value: string) => {
    updateSelectedWall((wall) => {
      wall.color = value
    })
  }

  const handleThicknessChange = (values: number[]) => {
    const [thickness] = values
    updateSelectedWall((wall) => {
      wall.thickness = thickness
    })
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    updateSelectedWall((wall) => {
      wall.height = height
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('wall-properties') : closePanel('wall-properties')
      }
    >
      <SheetContent className='w-[360px] sm:w-[420px]' side='right'>
        <SheetHeader>
          <SheetTitle>Wall Properties</SheetTitle>
        </SheetHeader>

        {selectedWall ? (
          <div className='mt-6 space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='wall-color'>Color</Label>
              <Input
                id='wall-color'
                type='color'
                value={selectedWall.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Thickness ({selectedWall.thickness.toFixed(2)} m)</Label>
              <Slider
                max={2}
                min={0.05}
                step={0.01}
                value={[selectedWall.thickness]}
                onValueChange={handleThicknessChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Height ({selectedWall.height.toFixed(2)} m)</Label>
              <Slider
                max={10}
                min={0.5}
                step={0.1}
                value={[selectedWall.height]}
                onValueChange={handleHeightChange}
              />
            </div>
          </div>
        ) : (
          <p className='mt-6 text-sm text-muted-foreground'>
            Select a wall to edit its properties.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
