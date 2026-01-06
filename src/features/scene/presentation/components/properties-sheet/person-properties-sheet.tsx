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

export const PersonPropertiesSheet: React.FC = () => {
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const people = useSceneStore((state) => state.scene.people)
  const updateScene = useSceneStore((state) => state.updateScene)

  const isOpen = openPanels['person-properties'] ?? false
  const selectedPerson = React.useMemo(() => {
    const personId = selectedEntityIds.find((id) => id.startsWith('person-'))
    if (!personId) return null
    return people.find((person) => person.id === personId) ?? null
  }, [people, selectedEntityIds])

  const updateSelectedPerson = React.useCallback(
    (updater: (person: (typeof people)[number]) => void) => {
      if (!selectedPerson) return
      updateScene((scene) => {
        const target = scene.people.find(
          (person) => person.id === selectedPerson.id,
        )
        if (target) {
          updater(target)
        }
      })
    },
    [selectedPerson, updateScene],
  )

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    updateSelectedPerson((person) => {
      person.height = height
    })
  }

  const handleSpeedChange = (values: number[]) => {
    const [speed] = values
    updateSelectedPerson((person) => {
      person.speed = speed
    })
  }

  const handlePositionChange = (
    key: 'x' | 'y',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number.parseFloat(event.target.value)
    if (!Number.isFinite(value)) {
      return
    }
    updateSelectedPerson((person) => {
      person[key] = value
    })
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('person-properties') : closePanel('person-properties')
      }
    >
      <SheetContent className='w-[360px] sm:w-[420px]' side='right'>
        <SheetHeader>
          <SheetTitle>Person Properties</SheetTitle>
        </SheetHeader>

        {selectedPerson ? (
          <div className='mt-6 space-y-6'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='person-x'>Position X</Label>
                <Input
                  id='person-x'
                  inputMode='decimal'
                  type='number'
                  value={selectedPerson.x.toFixed(3)}
                  onChange={(event) => handlePositionChange('x', event)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='person-y'>Position Y</Label>
                <Input
                  id='person-y'
                  inputMode='decimal'
                  type='number'
                  value={selectedPerson.y.toFixed(3)}
                  onChange={(event) => handlePositionChange('y', event)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Height ({selectedPerson.height.toFixed(2)} m)</Label>
              <Slider
                max={1.9}
                min={0.5}
                step={0.05}
                value={[selectedPerson.height]}
                onValueChange={handleHeightChange}
              />
            </div>

            <div className='space-y-2'>
              <Label>Speed ({selectedPerson.speed.toFixed(2)} m/s)</Label>
              <Slider
                max={5}
                min={0.1}
                step={0.1}
                value={[selectedPerson.speed]}
                onValueChange={handleSpeedChange}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='behavior'>Behavior</Label>
              <Input id='behavior' value='Roam' readOnly />
            </div>
          </div>
        ) : (
          <p className='mt-6 text-sm text-muted-foreground'>
            Select a person to edit its properties.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
