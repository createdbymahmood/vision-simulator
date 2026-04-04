import {lineString, length as turfLength} from '@turf/turf'
import React from 'react'

import type {SceneRoot} from '@/features/scene/types/types'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/state/scene.store'
import {useUiStore} from '@/features/scene/state/ui.store'
import {formatMeters} from '@/features/scene/map/map-view-helpers'
import {useFrameSceneUpdate} from '@/features/scene/hooks/use-frame-scene-update'
import {useHistoryRecorder} from '@/features/scene/hooks/use-history-recorder'

import {
  PropertiesDeleteAction,
  PropertiesSection,
  PropertiesShell,
} from './properties-shell'

interface MetricProps {
  label: string
  value: string
}

const Metric: React.FC<MetricProps> = ({label, value}) => (
  <div className='vs:space-y-1 vs:rounded-md vs:border vs:p-3'>
    <p className='vs:text-xs vs:text-muted-foreground'>{label}</p>
    <p className='vs:text-sm vs:font-semibold'>{value}</p>
  </div>
)

// eslint-disable-next-line max-lines-per-function
export const WallPropertiesSheet: React.FC = () => {
  const {recordAction, recordActionDebounced} = useHistoryRecorder()
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const clearSelection = useSceneStore((state) => state.clearSelection)
  const deleteEntities = useSceneStore((state) => state.deleteEntities)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const walls = useSceneStore((state) => state.scene.walls)
  const updateScene = useSceneStore((state) => state.updateScene)
  const {scheduleSceneUpdate} = useFrameSceneUpdate({updateScene})

  const isPanelOpen = openPanels['wall-properties'] ?? false
  const selectedWall = React.useMemo(() => {
    const wallId = selectedEntityIds.find((id) => id.startsWith('wall-'))
    if (!wallId) return null
    return walls.find((wall) => wall.id === wallId) ?? null
  }, [selectedEntityIds, walls])
  const isOpen = isPanelOpen && Boolean(selectedWall)

  const updateSelectedWall = React.useCallback(
    (
      updater: (wall: (typeof walls)[number]) => void,
      onApplied?: (scene: SceneRoot) => void,
    ) => {
      if (!selectedWall) {
        return
      }
      scheduleSceneUpdate((scene) => {
        const target = scene.walls.find((wall) => wall.id === selectedWall.id)
        if (target) {
          updater(target)
        }
      }, onApplied)
    },
    [scheduleSceneUpdate, selectedWall],
  )

  const handleColorChange = (value: string) => {
    if (!selectedWall) return
    const wallId = selectedWall.id
    updateSelectedWall(
      (wall) => {
        wall.color = value
      },
      (updated) => {
        recordActionDebounced(
          `wall-${wallId}`,
          {type: 'update', entity: 'wall'},
          updated,
        )
      },
    )
  }

  const handleThicknessChange = (values: number[]) => {
    if (!selectedWall) return
    const [thickness] = values
    const wallId = selectedWall.id
    updateSelectedWall(
      (wall) => {
        wall.thickness = thickness
      },
      (updated) => {
        recordActionDebounced(
          `wall-${wallId}`,
          {type: 'update', entity: 'wall'},
          updated,
        )
      },
    )
  }

  const handleHeightChange = (values: number[]) => {
    if (!selectedWall) return
    const [height] = values
    const wallId = selectedWall.id
    updateSelectedWall(
      (wall) => {
        wall.height = height
      },
      (updated) => {
        recordActionDebounced(
          `wall-${wallId}`,
          {type: 'update', entity: 'wall'},
          updated,
        )
      },
    )
  }

  const handleNumericInput = (
    event: React.ChangeEvent<HTMLInputElement>,
    onValid: (value: number) => void,
  ) => {
    const next = Number.parseFloat(event.target.value)
    if (!Number.isFinite(next)) return
    onValid(next)
  }

  const totalLength =
    selectedWall && selectedWall.points.length >= 2
      ? turfLength(lineString(selectedWall.points), {units: 'kilometers'}) *
        1000
      : 0
  const segmentCount = selectedWall
    ? Math.max(0, selectedWall.points.length - 1)
    : 0

  const handleDeleteWall = () => {
    if (!selectedWall) {
      return
    }
    const updated = deleteEntities([selectedWall.id])
    recordAction({type: 'delete', entity: 'wall', count: 1}, updated)
    clearSelection()
    closePanel('wall-properties')
  }

  return (
    <PropertiesShell
      entityId={selectedWall?.id}
      title='Wall Properties'
      accentColor={selectedWall?.color}
      actions={
        selectedWall ? (
          <PropertiesDeleteAction
            confirmDescription='This wall will be permanently removed.'
            confirmTitle='Delete wall?'
            onConfirm={handleDeleteWall}
          />
        ) : null
      }
      onOpenChange={(open) =>
        open ? openPanel('wall-properties') : closePanel('wall-properties')
      }
      open={isOpen}
    >
      {selectedWall ? (
        <div className='vs:space-y-6'>
          <PropertiesSection title='Metrics'>
            <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
              <Metric label='Segments' value={segmentCount.toString()} />
              <Metric label='Total Length' value={formatMeters(totalLength)} />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Appearance & Dimensions'>
            <div className='vs:space-y-2'>
              <Label htmlFor='wall-color'>Color</Label>
              <Input
                id='wall-color'
                type='color'
                value={selectedWall.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>

            <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
              <div className='vs:space-y-2'>
                <Label>Thickness ({selectedWall.thickness.toFixed(2)} m)</Label>
                <Slider
                  max={2}
                  min={0.05}
                  step={0.01}
                  value={[selectedWall.thickness]}
                  onValueChange={handleThicknessChange}
                />
              </div>
              <div className='vs:space-y-2'>
                <Label className='vs:sr-only'>Thickness input</Label>
                <Input
                  min={0.05}
                  step={0.01}
                  type='number'
                  value={selectedWall.thickness.toFixed(2)}
                  onChange={(event) =>
                    handleNumericInput(event, (value) =>
                      handleThicknessChange([value]),
                    )
                  }
                />
              </div>
            </div>

            <div className='vs:grid vs:grid-cols-2 vs:gap-3'>
              <div className='vs:space-y-2'>
                <Label>Height ({selectedWall.height.toFixed(2)} m)</Label>
                <Slider
                  max={10}
                  min={0.5}
                  step={0.1}
                  value={[selectedWall.height]}
                  onValueChange={handleHeightChange}
                />
              </div>
              <div className='vs:space-y-2'>
                <Label className='vs:sr-only'>Height input</Label>
                <Input
                  min={0.5}
                  step={0.1}
                  type='number'
                  value={selectedWall.height.toFixed(2)}
                  onChange={(event) =>
                    handleNumericInput(event, (value) =>
                      handleHeightChange([value]),
                    )
                  }
                />
              </div>
            </div>
          </PropertiesSection>
        </div>
      ) : (
        <p className='vs:text-sm vs:text-muted-foreground'>
          Select a wall to edit its properties.
        </p>
      )}
    </PropertiesShell>
  )
}
