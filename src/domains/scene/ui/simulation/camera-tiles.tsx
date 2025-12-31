import React, {useMemo} from 'react'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

import {CameraFeed} from './camera-feed'

interface CameraTilesProps {
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  selectedPersonId: string | null
  onSelectPerson?: (id: string) => void
}

export const CameraTiles: React.FC<CameraTilesProps> = ({
  cameras,
  cameraVisions,
  walls,
  shapes,
  people,
  selectedPersonId,
  onSelectPerson,
}) => {
  const visionLookup = useMemo(
    () => new Map(cameraVisions.map((vision) => [vision.id, vision])),
    [cameraVisions],
  )

  return (
    <div className='space-y-2'>
      <div className='text-sm font-medium text-muted-foreground'>
        Camera POV
      </div>

      <div className='flex flex-col gap-2'>
        {cameras.map((camera) => {
          const vision = visionLookup.get(camera.id)
          if (!vision) {
            return null
          }
          return (
            <Card className='flex flex-col gap-2' key={camera.id}>
              <CardHeader className='mb-0'>
                <CardTitle className='text-sm font-semibold'>
                  Camera {camera.id.slice(0, 4)}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <CameraFeed
                  camera={camera}
                  shapes={shapes}
                  walls={walls}
                  onSelectPerson={onSelectPerson}
                  people={people}
                  selectedPersonId={selectedPersonId}
                  vision={vision}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

CameraTiles.displayName = 'camera-tiles'
