import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {useFrameSceneUpdate} from '@/features/scene/presentation/hooks/use-frame-scene-update'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

import {PropertiesSection, PropertiesShell} from './properties-shell'

export const PersonPropertiesSheet: React.FC = () => {
  const {recordActionDebounced} = useHistoryRecorder()
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const people = useSceneStore((state) => state.scene.people)
  const updateScene = useSceneStore((state) => state.updateScene)
  const {scheduleSceneUpdate} = useFrameSceneUpdate({updateScene})

  const isOpen = openPanels['person-properties'] ?? false
  const selectedPerson = React.useMemo(() => {
    const personId = selectedEntityIds.find((id) => id.startsWith('person-'))
    if (!personId) return null
    return people.find((person) => person.id === personId) ?? null
  }, [people, selectedEntityIds])

  const personName = (
    selectedPerson?.name ??
    selectedPerson?.id ??
    ''
  ).toString()

  const updateSelectedPerson = React.useCallback(
    (
      updater: (person: (typeof people)[number]) => void,
      onApplied?: (scene: SceneRoot) => void,
    ) => {
      if (!selectedPerson) {
        return
      }
      scheduleSceneUpdate((scene) => {
        const target = scene.people.find(
          (person) => person.id === selectedPerson.id,
        )
        if (target) {
          updater(target)
        }
      }, onApplied)
    },
    [scheduleSceneUpdate, selectedPerson],
  )

  const handleHeightChange = (values: number[]) => {
    if (!selectedPerson) return
    const [height] = values
    const personId = selectedPerson.id
    updateSelectedPerson(
      (person) => {
        person.height = height
      },
      (updated) => {
        recordActionDebounced(
          `person-${personId}`,
          {type: 'update', entity: 'person'},
          updated,
        )
      },
    )
  }

  const handleSpeedChange = (values: number[]) => {
    if (!selectedPerson) return
    const [speed] = values
    const personId = selectedPerson.id
    updateSelectedPerson(
      (person) => {
        person.speed = speed
      },
      (updated) => {
        recordActionDebounced(
          `person-${personId}`,
          {type: 'update', entity: 'person'},
          updated,
        )
      },
    )
  }

  return (
    <PropertiesShell
      entityId={selectedPerson?.id}
      entityName={selectedPerson?.name}
      title='Person Properties'
      onOpenChange={(open) =>
        open ? openPanel('person-properties') : closePanel('person-properties')
      }
      open={isOpen}
    >
      {selectedPerson ? (
        <div className='space-y-6'>
          <PropertiesSection title='Identity'>
            <div className='space-y-2'>
              <Label htmlFor='person-name'>Name</Label>
              <Input
                id='person-name'
                value={personName}
                onChange={(event) => {
                  if (!selectedPerson) return
                  const personId = selectedPerson.id
                  updateSelectedPerson(
                    (person) => {
                      person.name = event.target.value
                    },
                    (updated) => {
                      recordActionDebounced(
                        `person-${personId}`,
                        {type: 'update', entity: 'person'},
                        updated,
                      )
                    },
                  )
                }}
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Physical'>
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
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Select a person to edit their properties.
        </p>
      )}
    </PropertiesShell>
  )
}
