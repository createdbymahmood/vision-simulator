import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {SceneRoot} from '@/features/scene/domain/types'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {useSceneStore} from '@/features/scene/infrastructure/stores/scene.store'
import {useUiStore} from '@/features/scene/infrastructure/stores/ui.store'

import type {CameraFeedTarget} from './camera-feed-types'

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
  const visionState = useUiStore((state) => state.visionState)

  const originPoint = React.useMemo(() => computeSceneOrigin(scene), [scene])
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )

  const detectionsByCamera = visionState.visibleByCameraId
  const peopleWorld = visionState.peopleWorld
  const handleSelect = useCallbackRef((cameraId: string) => {
    setSelection([cameraId])
  })

  return (
    <div className='flex flex-col gap-4 size-full'>
      <Card className='rounded-none border-none p-0 shadow-none gap-0'>
        <CardHeader className='py-2'>
          <CardTitle>Camera Feeds</CardTitle>
        </CardHeader>

        <CardContent className='px-0'>
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
                  key={camera.id}
                  feedCount={feedTargets.length}
                  onSelect={handleSelect}
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
