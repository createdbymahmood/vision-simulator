import React from 'react'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import {CameraFeedTile} from './camera-feed-tile'
import type {CameraFeedTarget} from './simulation-scene'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'

interface SimulationCameraSidebarProps {
  scene: SceneRoot
  feedTargets: CameraFeedTarget[]
}

export const SimulationCameraSidebar: React.FC<SimulationCameraSidebarProps> = ({
  scene,
  feedTargets,
}) => {
  const setSelection = useSceneStore((state) => state.setSelection)
  const activeCameraId = useUiStore((state) => state.activeCameraId)
  const setActiveCameraId = useUiStore((state) => state.setActiveCameraId)
  const cameraFeedGrid = useUiStore((state) => state.cameraFeedGrid)
  const setCameraFeedGrid = useUiStore((state) => state.setCameraFeedGrid)
  const visionState = useUiStore((state) => state.visionState)

  const originPoint = React.useMemo(() => computeSceneOrigin(scene), [scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const detectionsByCamera = visionState.visibleByCameraId
  const peopleWorld = visionState.peopleWorld

  const handleActivateCamera = useCallbackRef((cameraId: string) => {
    setActiveCameraId(cameraId)
    setSelection([cameraId])
  })

  const handleGridChange = useCallbackRef((value: string) => {
    if (value) {
      setCameraFeedGrid(value as typeof cameraFeedGrid)
    }
  })

  const handleOpenChange = useCallbackRef((nextOpen: boolean) => {
    if (nextOpen) {
      return
    }
  })

  const gridColumns =
    cameraFeedGrid === '2x2' ? 2 : cameraFeedGrid === '3x3' ? 3 : 4

  return (
    <Popover modal={false} open onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div className='pointer-events-auto absolute right-4 top-4 bottom-4 w-1' />
      </PopoverAnchor>
      <PopoverContent align='start' side='left' sideOffset={16}>
        <div className='flex flex-col gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>Cameras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col gap-2'>
                {scene.cameras.map((camera) => (
                  <Button
                    key={camera.id}
                    variant={
                      activeCameraId === camera.id ? 'default' : 'outline'
                    }
                    onClick={() => handleActivateCamera(camera.id)}
                  >
                    <span className='flex w-full items-center justify-between text-xs'>
                      <span>{camera.name}</span>
                      <Badge>{detectionsByCamera[camera.id]?.length ?? 0}</Badge>
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Camera Feeds</CardTitle>
              <CardAction>
                <ToggleGroup
                  type='single'
                  value={cameraFeedGrid}
                  onValueChange={handleGridChange}
                >
                  <ToggleGroupItem value='2x2'>2x2</ToggleGroupItem>
                  <ToggleGroupItem value='3x3'>3x3</ToggleGroupItem>
                  <ToggleGroupItem value='4x4'>4x4</ToggleGroupItem>
                </ToggleGroup>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div
                className='grid gap-2'
                style={{
                  gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                }}
              >
                {feedTargets.map((target) => {
                  const camera = scene.cameras.find(
                    (item) => item.id === target.id,
                  )
                  if (!camera) {
                    return null
                  }
                  const peopleIds = detectionsByCamera[camera.id] ?? []
                  return (
                    <CameraFeedTile
                      key={camera.id}
                      camera={camera}
                      feedTarget={target}
                      peopleIds={peopleIds}
                      peopleWorld={peopleWorld}
                      isActive={activeCameraId === camera.id}
                      onActivate={() => handleActivateCamera(camera.id)}
                      transformer={transformer}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </PopoverContent>
    </Popover>
  )
}
