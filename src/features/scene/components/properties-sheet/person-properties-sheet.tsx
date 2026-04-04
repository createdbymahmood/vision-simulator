import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'
import {useFrameSceneUpdate} from '@/features/scene/hooks/use-frame-scene-update'
import {useHistoryRecorder} from '@/features/scene/hooks/use-history-recorder'

import {
  PropertiesDeleteAction,
  PropertiesSection,
  PropertiesShell,
} from './properties-shell'

// eslint-disable-next-line max-lines-per-function
export const PersonPropertiesSheet: React.FC = () => {
  const {recordAction, recordActionDebounced} = useHistoryRecorder()
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const clearSelection = useSceneStore((state) => state.clearSelection)
  const deleteEntities = useSceneStore((state) => state.deleteEntities)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const people = useSceneStore((state) => state.scene.people)
  const updatePerson = useSceneStore((state) => state.updatePerson)
  const updateScene = useSceneStore((state) => state.updateScene)
  const {scheduleSceneUpdate} = useFrameSceneUpdate({updateScene})

  const isPanelOpen = openPanels['person-properties'] ?? false
  const selectedPerson = React.useMemo(() => {
    const personId = selectedEntityIds.find((id) => id.startsWith('person-'))
    if (!personId) return null
    return people.find((person) => person.id === personId) ?? null
  }, [people, selectedEntityIds])
  const isOpen = isPanelOpen && Boolean(selectedPerson)

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

  const handleNameChange = (value: string) => {
    if (!selectedPerson) {
      return
    }
    const personId = selectedPerson.id
    const updated = updatePerson(personId, (person) => {
      person.name = value
    })
    recordActionDebounced(
      `person-${personId}`,
      {type: 'update', entity: 'person'},
      updated,
    )
  }

  const handleDeletePerson = () => {
    if (!selectedPerson) {
      return
    }
    const updated = deleteEntities([selectedPerson.id])
    recordAction({type: 'delete', entity: 'person', count: 1}, updated)
    clearSelection()
    closePanel('person-properties')
  }

  return (
    <PropertiesShell
      entityId={selectedPerson?.id}
      entityName={selectedPerson?.name}
      title='Person Properties'
      actions={
        selectedPerson ? (
          <PropertiesDeleteAction
            confirmDescription='This person will be permanently removed.'
            confirmTitle='Delete person?'
            onConfirm={handleDeletePerson}
          />
        ) : null
      }
      onOpenChange={(open) =>
        open ? openPanel('person-properties') : closePanel('person-properties')
      }
      open={isOpen}
    >
      {selectedPerson ? (
        <div className='vs:space-y-6'>
          <PropertiesSection title='Identity'>
            <div className='vs:space-y-2'>
              <Label htmlFor='person-name'>Name</Label>
              <Input
                id='person-name'
                value={personName}
                onChange={(event) => handleNameChange(event.target.value)}
              />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Physical'>
            <div className='vs:space-y-2'>
              <Label>Height ({selectedPerson.height.toFixed(2)} m)</Label>
              <Slider
                max={1.9}
                min={0.5}
                step={0.05}
                value={[selectedPerson.height]}
                onValueChange={handleHeightChange}
              />
            </div>
            <div className='vs:space-y-2'>
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
        <p className='vs:text-sm vs:text-muted-foreground'>
          Select a person to edit their properties.
        </p>
      )}
    </PropertiesShell>
  )
}
