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
  focusAreaId?: string
}

export const SimulationCameraSidebar: React.FC<
  SimulationCameraSidebarProps
> = ({scene, feedTargets, focusAreaId}) => {
  const visionState = useUiStore((state) => state.visionState)
  const selectedEntityIds = useSceneStore((state) => state.selectedEntityIds)

  const framedScene = React.useMemo(() => {
    if (!focusAreaId) {
      return scene
    }
    return {
      ...scene,
      areas: scene.areas.filter((area) => area.id === focusAreaId),
      walls: scene.walls.filter((wall) => wall.areaId === focusAreaId),
      shapes: scene.shapes.filter((shape) => shape.areaId === focusAreaId),
      cameras: scene.cameras.filter((camera) => camera.areaId === focusAreaId),
      people: scene.people.filter((person) => person.areaId === focusAreaId),
    }
  }, [focusAreaId, scene])
  const originPoint = React.useMemo(
    () => computeSceneOrigin(framedScene),
    [framedScene],
  )
  const transformer = React.useMemo(
    () => createCoordinateTransformer(originPoint),
    [originPoint],
  )
  const selectedPersonIds = React.useMemo(
    () =>
      selectedEntityIds.filter((entityId) => entityId.startsWith('person-')),
    [selectedEntityIds],
  )

  const detectionsByCamera = visionState.visibleByCameraId
  const peopleWorld = visionState.peopleWorld

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
                  peopleIds={peopleIds}
                  peopleWorld={peopleWorld}
                  selectedPersonIds={selectedPersonIds}
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
