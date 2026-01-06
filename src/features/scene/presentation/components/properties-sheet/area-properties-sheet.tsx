import React from 'react'

import {Input} from '@/components/ui/input'
import {InputGroup} from '@/components/ui/input-group'
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

export const AreaPropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const areas = useSceneStore((state) => state.scene.areas)
  const updateScene = useSceneStore((state) => state.updateScene)
  const updateAreaName = useSceneStore((state) => state.updateAreaName)

  const isOpen = openPanels['area-properties'] ?? false
  const selectedArea = React.useMemo(() => {
    const areaId = selectedEntityIds.find((id) => id.startsWith('area-'))
    if (!areaId) return null
    return areas.find((area) => area.id === areaId) ?? null
  }, [areas, selectedEntityIds])

  const updateSelectedArea = React.useCallback(
    (updater: (area: (typeof areas)[number]) => void) => {
      if (!selectedArea) return
      updateScene((scene) => {
        const target = scene.areas.find((area) => area.id === selectedArea.id)
        if (target) {
          updater(target)
        }
      })
    },
    [selectedArea, updateScene],
  )

  const handleNameChange = (value: string) => {
    if (!selectedArea) return
    updateAreaName(selectedArea.id, value)
  }

  const handleFillChange = (value: string) => {
    updateSelectedArea((area) => {
      area.style.fillColor = value
    })
  }

  const handleBorderColorChange = (value: string) => {
    updateSelectedArea((area) => {
      area.style.borderColor = value
    })
  }

  const handleFillOpacityChange = (values: number[]) => {
    const [opacity] = values
    updateSelectedArea((area) => {
      area.style.fillOpacity = opacity
    })
  }

  const handleBorderWidthChange = (values: number[]) => {
    const [width] = values
    updateSelectedArea((area) => {
      area.style.borderWidth = width
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('area-properties') : closePanel('area-properties')
      }
    >
      <SheetContent className='w-[360px] sm:w-[420px]' side='right'>
        <SheetHeader>
          <SheetTitle>Area Properties</SheetTitle>
        </SheetHeader>

        {selectedArea ? (
          <div className='mt-6 space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='area-name'>Name</Label>
              <Input
                id='area-name'
                value={selectedArea.name}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='area-fill'>Fill Color</Label>
              <Input
                id='area-fill'
                type='color'
                value={selectedArea.style.fillColor}
                onChange={(event) => handleFillChange(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='area-border'>Border Color</Label>
              <Input
                id='area-border'
                type='color'
                value={selectedArea.style.borderColor}
                onChange={(event) => handleBorderColorChange(event.target.value)}
              />
            </div>

            <InputGroup className='gap-4'>
              <div className='flex-1 space-y-2'>
                <Label>Fill Opacity ({selectedArea.style.fillOpacity.toFixed(2)})</Label>
                <Slider
                  max={1}
                  min={0}
                  step={0.01}
                  value={[selectedArea.style.fillOpacity]}
                  onValueChange={handleFillOpacityChange}
                />
              </div>
              <div className='flex-1 space-y-2'>
                <Label>Border Width ({selectedArea.style.borderWidth.toFixed(1)} m)</Label>
                <Slider
                  max={5}
                  min={0}
                  step={0.1}
                  value={[selectedArea.style.borderWidth]}
                  onValueChange={handleBorderWidthChange}
                />
              </div>
            </InputGroup>
          </div>
        ) : (
          <p className='mt-6 text-sm text-muted-foreground'>
            Select an area to edit its properties.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
