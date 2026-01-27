import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
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

import {SimulationCameraSidebar} from './simulation-camera-sidebar'
import {SimulationCanvas} from './simulation-canvas'
import {SimulationRadar} from './simulation-radar'
import {useCameraFeedTargets} from './use-camera-feed-targets'

interface AreaOption {
  id: string
  label: string
  objects: number
}

const formatAreaLabel = (name: string, count: number) =>
  `${name} (${count} objects)`

// eslint-disable-next-line max-lines-per-function
export const SimulationAnalysisView: React.FC = () => {
  const scene = useSceneStore((state) => state.scene)
  const setSceneMode = useSceneStore((state) => state.setMode)
  const setMapVisibility = useSceneStore((state) => state.setMapVisibility)
  const setActiveArea = useSceneStore((state) => state.setActiveArea)
  const setSelection = useSceneStore((state) => state.setSelection)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

  const setViewMode = useUiStore((state) => state.setViewMode)
  const activeCameraId = useUiStore((state) => state.activeCameraId)
  const setActiveCameraId = useUiStore((state) => state.setActiveCameraId)
  const cycleActiveCamera = useUiStore((state) => state.cycleActiveCamera)
  const cameraFeedGrid = useUiStore((state) => state.cameraFeedGrid)
  const radarSize = useUiStore((state) => state.radarSettings.size)

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
  const cameraIds = React.useMemo(
    () => scene.cameras.map((camera) => camera.id),
    [scene.cameras],
  )
  const selectedCameraId = React.useMemo(
    () => selectedEntityIds.find((id) => id.startsWith('camera-')),
    [selectedEntityIds],
  )
  const sidebarPadding = 16
  const sidebarWidth = radarSize.width + sidebarPadding * 2
  const feedTargets = useCameraFeedTargets({
    cameras: scene.cameras,
    grid: cameraFeedGrid,
    activeCameraId,
  })

  const handleAreaChange = (value: string) => {
    const nextArea = value === 'all' ? undefined : value
    setActiveArea(nextArea)
    setSelection([])
  }

  const handleSceneModeChange = (mode: SceneMode) => {
    setSceneMode(mode)
    setMapVisibility(mode === 'map')
  }

  React.useEffect(() => {
    if (selectedCameraId) {
      setActiveCameraId(selectedCameraId)
    }
  }, [selectedCameraId, setActiveCameraId])

  React.useEffect(() => {
    if (!activeCameraId && cameraIds.length > 0) {
      setActiveCameraId(cameraIds[0])
    }
  }, [activeCameraId, cameraIds, setActiveCameraId])

  const onCycleCamera = useCallbackRef(() => {
    const nextId = cycleActiveCamera(cameraIds)
    if (nextId) {
      setSelection([nextId])
    }
  })

  const handleSelectEntity = useCallbackRef((id?: string) => {
    setSelection(id ? [id] : [])
  })

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select')) {
        return
      }
      event.preventDefault()
      onCycleCamera()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCycleCamera])

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden overscroll-none'>
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

      <div className='flex flex-1 min-h-0 overflow-hidden'>
        <div className='relative flex-1 overflow-hidden'>
          <div className='absolute inset-0'>
            <SimulationCanvas
              cameraFeedTargets={feedTargets}
              scene={scene}
              selectedEntityIds={selectedEntityIds}
              focusAreaId={scene.activeAreaId}
              onSelectEntity={handleSelectEntity}
              sceneMode={scene.mode}
              showMapTexture={
                scene.mode === 'canvas'
                  ? true
                  : scene.mapVisible && scene.mode === 'map'
              }
            />
          </div>
        </div>
        <div
          className='flex h-full min-h-0 shrink-0 flex-col gap-4 overflow-y-auto overscroll-contain border-l'
          style={{width: sidebarWidth, padding: sidebarPadding}}
        >
          <SimulationRadar
            scene={scene}
            selectedEntityIds={selectedEntityIds}
            onSelectEntity={handleSelectEntity}
          />
          {scene.cameras.length > 0 ? (
            <SimulationCameraSidebar feedTargets={feedTargets} scene={scene} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
