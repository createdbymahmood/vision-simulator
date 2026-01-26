import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {CameraFeedTarget} from './simulation-scene'

import {CameraFeedTile} from './camera-feed-tile'
import {
  computeSceneOrigin,
  createCoordinateTransformer,
} from './simulation-helpers'

interface SimulationCameraSidebarProps {
  scene: SceneRoot
  feedTargets: CameraFeedTarget[]
}

export const SimulationCameraSidebar: React.FC<
  SimulationCameraSidebarProps
> = ({scene, feedTargets}) => {
  const setSelection = useSceneStore((state) => state.setSelection)
  const activeCameraId = useUiStore((state) => state.activeCameraId)
  const setActiveCameraId = useUiStore((state) => state.setActiveCameraId)
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

  return (
    <div className='flex flex-col gap-4 size-full'>
      <Card>
        <CardHeader>
          <CardTitle>Cameras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2'>
            {scene.cameras.map((camera) => (
              <Button
                key={camera.id}
                variant={activeCameraId === camera.id ? 'default' : 'outline'}
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
        </CardHeader>
        <CardContent>
          <div className='grid gap-2'>
            {feedTargets.map((target) => {
              const camera = scene.cameras.find((item) => item.id === target.id)
              if (!camera) {
                return null
              }
              const peopleIds = detectionsByCamera[camera.id] ?? []
              return (
                <CameraFeedTile
                  camera={camera}
                  feedTarget={target}
                  isActive={activeCameraId === camera.id}
                  key={camera.id}
                  onActivate={() => handleActivateCamera(camera.id)}
                  peopleIds={peopleIds}
                  peopleWorld={peopleWorld}
                  transformer={transformer}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
