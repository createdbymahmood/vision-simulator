import {ArrowLeft, Film, Image, Map, MapPin, ToggleLeft} from 'lucide-react'
import React from 'react'

import type {SceneEntity, SceneMode} from '@/features/scene/domain/types'

import {Button} from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import {SimulationCanvas} from './simulation-canvas'

interface AreaOption {
  id: string
  label: string
  objects: number
}

const formatAreaLabel = (name: string, count: number) =>
  `${name} (${count} objects)`

export const SimulationAnalysisView: React.FC = () => {
  const scene = useSceneStore((state) => state.scene)
  const setSceneMode = useSceneStore((state) => state.setMode)
  const setMapVisibility = useSceneStore((state) => state.setMapVisibility)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

  const setViewMode = useUiStore((state) => state.setViewMode)

  const areaOptions: AreaOption[] = React.useMemo(() => {
    const getCount = (areaId: string) =>
      [
        ...scene.walls,
        ...scene.shapes,
        ...scene.cameras,
        ...scene.people,
      ].filter(
        (entity: SceneEntity) => 'areaId' in entity && entity.areaId === areaId,
      ).length

    return scene.areas.map((area) => ({
      id: area.id,
      label: formatAreaLabel(area.name, getCount(area.id)),
      objects: getCount(area.id),
    }))
  }, [scene.cameras, scene.people, scene.shapes, scene.walls, scene.areas])

  const hasMultipleAreas = areaOptions.length > 1
  const activeAreaId = scene.activeAreaId ?? 'all'

  const handleAreaChange = (value: string) => {
    const nextArea = value === 'all' ? undefined : value
    setActiveArea(nextArea)
    setSelection([])
  }

  const handleSceneModeChange = (mode: SceneMode) => {
    setSceneMode(mode)
    setMapVisibility(mode === 'map')
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex h-14 items-center bg-background/80 backdrop-blur px-4 border-b gap-2'>
        <div className='flex items-center gap-4'>
          <div className='inline-flex items-center gap-1 rounded-full bg-muted'>
            <Button
              size='sm'
              className='rounded-full'
              variant={scene.mode === 'map' ? 'default' : 'ghost'}
              onClick={() => handleSceneModeChange('map')}
            >
              <Map className='mr-2 h-4 w-4' />
              Map
            </Button>
            <Button
              size='sm'
              className='rounded-full'
              variant={scene.mode === 'canvas' ? 'default' : 'ghost'}
              onClick={() => handleSceneModeChange('canvas')}
            >
              <ToggleLeft className='mr-2 h-4 w-4' />
              Canvas
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {hasMultipleAreas ? (
            <Select value={activeAreaId} onValueChange={handleAreaChange}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='All Areas' />
              </SelectTrigger>
              <SelectContent align='center'>
                <SelectItem value='all'>All Areas</SelectItem>
                <div className='my-1 h-px bg-border' />
                {areaOptions.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block size-2.5 rounded-full'
                        style={{
                          backgroundColor:
                            area.id === scene.activeAreaId
                              ? '#0EA5E9'
                              : '#9CA3AF',
                        }}
                      />
                      {area.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <MapPin className='h-4 w-4' />
              {areaOptions[0]?.label ?? 'All Areas'}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2 ml-auto'>
          <Button size='sm' variant='outline'>
            <Film className='mr-2 h-4 w-4' />
            Start Recording
          </Button>
          <Button size='sm' variant='outline'>
            <Image className='mr-2 h-4 w-4' />
            Export Snapshot
          </Button>
        </div>

        <Button
          size='sm'
          variant='outline'
          onClick={() => setViewMode('editor')}
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Editor
        </Button>
      </div>

      <div className='relative flex-1 min-h-[520px] overflow-hidden shadow-inner'>
        <div className='absolute inset-0'>
          <SimulationCanvas
            scene={scene}
            selectedEntityIds={selectedEntityIds}
            focusAreaId={scene.activeAreaId}
            onSelectEntity={(id) => setSelection(id ? [id] : [])}
            sceneMode={scene.mode}
            showMapTexture={
              scene.mode === 'canvas'
                ? true
                : scene.mapVisible && scene.mode === 'map'
            }
          />
        </div>
      </div>
    </div>
  )
}
