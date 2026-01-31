import {lineString, length as turfLength} from '@turf/turf'
import React from 'react'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {formatMeters} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {useHistoryRecorder} from '@/features/scene/presentation/hooks/use-history-recorder'

import {PropertiesSection, PropertiesShell} from './properties-shell'

interface MetricProps {
  label: string
  value: string
}

const Metric: React.FC<MetricProps> = ({label, value}) => (
  <div className='space-y-1 rounded-md border p-3'>
    <p className='text-xs text-muted-foreground'>{label}</p>
    <p className='text-sm font-semibold'>{value}</p>
  </div>
)

// eslint-disable-next-line max-lines-per-function
export const WallPropertiesSheet: React.FC = () => {
  const {recordActionDebounced} = useHistoryRecorder()
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
      return updateScene((scene) => {
        const target = scene.walls.find((wall) => wall.id === selectedWall.id)
        if (target) {
          updater(target)
        }
      })
    },
    [selectedWall, updateScene],
  )

  const handleColorChange = (value: string) => {
    const updated = updateSelectedWall((wall) => {
      wall.color = value
    })
    if (updated && selectedWall) {
      recordActionDebounced(
        `wall-${selectedWall.id}`,
        {type: 'update', entity: 'wall'},
        updated,
      )
    }
  }

  const handleThicknessChange = (values: number[]) => {
    const [thickness] = values
    const updated = updateSelectedWall((wall) => {
      wall.thickness = thickness
    })
    if (updated && selectedWall) {
      recordActionDebounced(
        `wall-${selectedWall.id}`,
        {type: 'update', entity: 'wall'},
        updated,
      )
    }
  }

  const handleHeightChange = (values: number[]) => {
    const [height] = values
    const updated = updateSelectedWall((wall) => {
      wall.height = height
    })
    if (updated && selectedWall) {
      recordActionDebounced(
        `wall-${selectedWall.id}`,
        {type: 'update', entity: 'wall'},
        updated,
      )
    }
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

  return (
    <PropertiesShell
      entityId={selectedWall?.id}
      title='Wall Properties'
      accentColor={selectedWall?.color}
      onOpenChange={(open) =>
        open ? openPanel('wall-properties') : closePanel('wall-properties')
      }
      open={isOpen}
    >
      {selectedWall ? (
        <div className='space-y-6'>
          <PropertiesSection title='Metrics'>
            <div className='grid grid-cols-2 gap-3'>
              <Metric label='Segments' value={segmentCount.toString()} />
              <Metric label='Total Length' value={formatMeters(totalLength)} />
            </div>
          </PropertiesSection>

          <PropertiesSection title='Appearance & Dimensions'>
            <div className='space-y-2'>
              <Label htmlFor='wall-color'>Color</Label>
              <Input
                id='wall-color'
                type='color'
                value={selectedWall.color}
                onChange={(event) => handleColorChange(event.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
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
                <Label className='sr-only'>Thickness input</Label>
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

            <div className='grid grid-cols-2 gap-3'>
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
              <div className='space-y-2'>
                <Label className='sr-only'>Height input</Label>
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
        <p className='text-sm text-muted-foreground'>
          Select a wall to edit its properties.
        </p>
      )}
    </PropertiesShell>
  )
}
