import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Slider} from '@/components/ui/slider'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'
import {
  computeArea,
  computePerimeter,
  formatArea,
  formatMeters,
} from '@/features/scene/presentation/components/map-view/map-view-helpers'
import {useFrameSceneUpdate} from '@/features/scene/presentation/hooks/use-frame-scene-update'
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
export const AreaPropertiesSheet: React.FC = () => {
  const {recordActionDebounced} = useHistoryRecorder()
  const openPanels = useUiStore((state) => state.openPanels)
  const openPanel = useUiStore((state) => state.openPanel)
  const closePanel = useUiStore((state) => state.closePanel)

  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)
  const areas = useSceneStore((state) => state.scene.areas)
  const updateScene = useSceneStore((state) => state.updateScene)
  const updateAreaName = useSceneStore((state) => state.updateAreaName)
  const {scheduleSceneUpdate} = useFrameSceneUpdate({updateScene})

  const isOpen = openPanels['area-properties'] ?? false
  const selectedArea = React.useMemo(() => {
    const areaId = selectedEntityIds.find((id) => id.startsWith('area-'))
    if (!areaId) return null
    return areas.find((area) => area.id === areaId) ?? null
  }, [areas, selectedEntityIds])

  const updateSelectedArea = React.useCallback(
    (
      updater: (area: (typeof areas)[number]) => void,
      onApplied?: (scene: SceneRoot) => void,
    ) => {
      if (!selectedArea) {
        return
      }
      scheduleSceneUpdate((scene) => {
        const target = scene.areas.find((area) => area.id === selectedArea.id)
        if (target) {
          updater(target)
        }
      }, onApplied)
    },
    [scheduleSceneUpdate, selectedArea],
  )

  const handleNameChange = (value: string) => {
    if (!selectedArea) return
    const updated = updateAreaName(selectedArea.id, value)
    recordActionDebounced(
      `area-${selectedArea.id}`,
      {type: 'update', entity: 'area'},
      updated,
    )
  }

  const handleFillChange = (value: string) => {
    if (!selectedArea) return
    const areaId = selectedArea.id
    updateSelectedArea(
      (area) => {
        area.style.fillColor = value
      },
      (updated) => {
        recordActionDebounced(
          `area-${areaId}`,
          {type: 'update', entity: 'area'},
          updated,
        )
      },
    )
  }

  const handleBorderColorChange = (value: string) => {
    if (!selectedArea) return
    const areaId = selectedArea.id
    updateSelectedArea(
      (area) => {
        area.style.borderColor = value
      },
      (updated) => {
        recordActionDebounced(
          `area-${areaId}`,
          {type: 'update', entity: 'area'},
          updated,
        )
      },
    )
  }

  const handleFillOpacityChange = (values: number[]) => {
    if (!selectedArea) return
    const [opacity] = values
    const areaId = selectedArea.id
    updateSelectedArea(
      (area) => {
        area.style.fillOpacity = opacity
      },
      (updated) => {
        recordActionDebounced(
          `area-${areaId}`,
          {type: 'update', entity: 'area'},
          updated,
        )
      },
    )
  }

  const handleBorderWidthChange = (values: number[]) => {
    if (!selectedArea) return
    const [width] = values
    const areaId = selectedArea.id
    updateSelectedArea(
      (area) => {
        area.style.borderWidth = width
      },
      (updated) => {
        recordActionDebounced(
          `area-${areaId}`,
          {type: 'update', entity: 'area'},
          updated,
        )
      },
    )
  }

  const perimeter = selectedArea
    ? computePerimeter(selectedArea.geometry.coordinates)
    : 0
  const areaValue = selectedArea
    ? computeArea(selectedArea.geometry.coordinates)
    : 0

  return (
    <PropertiesShell
      entityId={selectedArea?.id}
      entityName={selectedArea?.name}
      title='Area Properties'
      accentColor={selectedArea?.style.fillColor}
      onOpenChange={(open) =>
        open ? openPanel('area-properties') : closePanel('area-properties')
      }
      open={isOpen}
    >
      {selectedArea ? (
        <div className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='area-name'>Name</Label>
            <Input
              id='area-name'
              value={selectedArea.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Point Count</p>
              <p className='text-sm font-medium'>{selectedArea.pointCount}</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <Metric label='Perimeter' value={formatMeters(perimeter)} />
            <Metric label='Area' value={formatArea(areaValue)} />
          </div>

          <PropertiesSection title='Fill & Border'>
            <div className='grid grid-cols-2 gap-3'>
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
                  onChange={(event) =>
                    handleBorderColorChange(event.target.value)
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>
                Fill Opacity ({selectedArea.style.fillOpacity.toFixed(2)})
              </Label>
              <Slider
                max={1}
                min={0}
                step={0.01}
                value={[selectedArea.style.fillOpacity]}
                onValueChange={handleFillOpacityChange}
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Border Width ({selectedArea.style.borderWidth.toFixed(1)} m)
              </Label>
              <Slider
                max={5}
                min={0}
                step={0.1}
                value={[selectedArea.style.borderWidth]}
                onValueChange={handleBorderWidthChange}
              />
            </div>
          </PropertiesSection>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Select an area to edit its properties.
        </p>
      )}
    </PropertiesShell>
  )
}
