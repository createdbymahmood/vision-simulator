import React from 'react'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'

import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {formatMeters} from '@/features/scene/presentation/components/map-view/map-view-helpers'

import {PropertiesSection, PropertiesShell} from './properties-shell'

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

  const personName =
    (selectedPerson?.name ?? selectedPerson?.id ?? '').toString()

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

  const handleRadiusChange = (values: number[]) => {
    const [radius] = values
    updateSelectedPerson((person) => {
      person.radius = radius
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
    <PropertiesShell
      open={isOpen}
      onOpenChange={(open) =>
        open ? openPanel('person-properties') : closePanel('person-properties')
      }
      title='Person Properties'
      entityId={selectedPerson?.id}
      entityName={selectedPerson?.name}
    >
      {selectedPerson ? (
        <div className='space-y-6'>
          <PropertiesSection title='Identity'>
            <div className='space-y-2'>
              <Label htmlFor='person-name'>Name</Label>
              <Input
                id='person-name'
                value={personName}
                onChange={(event) =>
                  updateSelectedPerson((person) => {
                    person.name = event.target.value
                  })
                }
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Position'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='person-x'>X (m)</Label>
                <Input
                  id='person-x'
                  inputMode='decimal'
                  type='number'
                  value={selectedPerson.x.toFixed(1)}
                  onChange={(event) => handlePositionChange('x', event)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='person-y'>Y (m)</Label>
                <Input
                  id='person-y'
                  inputMode='decimal'
                  type='number'
                  value={selectedPerson.y.toFixed(1)}
                  onChange={(event) => handlePositionChange('y', event)}
                />
              </div>
            </div>
          </PropertiesSection>

          <PropertiesSection title='Physical'>
            <div className='space-y-2'>
              <Label>
                Radius ({formatMeters(selectedPerson.radius)})
              </Label>
              <Slider
                max={1}
                min={0.1}
                step={0.01}
                value={[selectedPerson.radius]}
                onValueChange={handleRadiusChange}
              />
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
          </PropertiesSection>

          <PropertiesSection title='Behavior'>
            <div className='space-y-2'>
              <Label htmlFor='behavior'>Behavior</Label>
              <Select
                value={selectedPerson.behavior}
                onValueChange={(value) =>
                  updateSelectedPerson((person) => {
                    person.behavior = value as typeof person.behavior
                  })
                }
              >
                <SelectTrigger id='behavior'>
                  <SelectValue placeholder='Select behavior' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='roam'>Roam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center justify-between rounded-md border p-3'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Trail Enabled</p>
                <p className='text-xs text-muted-foreground'>
                  Toggle path tracing for this person.
                </p>
              </div>
              <Switch
                checked={selectedPerson.trailEnabled}
                onCheckedChange={(checked) =>
                  updateSelectedPerson((person) => {
                    person.trailEnabled = checked
                  })
                }
              />
            </div>
            {selectedPerson.trailEnabled ? (
              <div className='space-y-2'>
                <Label>Trail Length ({selectedPerson.trailLength.toFixed(0)} s)</Label>
                <Slider
                  max={120}
                  min={5}
                  step={5}
                  value={[selectedPerson.trailLength]}
                  onValueChange={(values) => {
                    const [length] = values
                    updateSelectedPerson((person) => {
                      person.trailLength = length
                    })
                  }}
                />
              </div>
            ) : null}
          </PropertiesSection>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Select a person to edit their properties.
        </p>
      )}
    </PropertiesShell>
  )
}
