import React from 'react'

import type {SceneCamera, SceneShape, SceneWall} from '../../core/scene-types'
import type {MovingPerson} from './people-movement'
import type {CameraVision} from './types'

import {Simulation2DView} from './simulation-2d-view'

interface SimulationMiniMapProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: MovingPerson[]
  cameras: SceneCamera[]
  cameraVisions: CameraVision[]
}

export const SimulationMiniMap: React.FC<SimulationMiniMapProps> = ({
  walls,
  shapes,
  people,
  cameras,
  cameraVisions,
}) => {
  return (
    <div className='rounded-lg border bg-muted p-3'>
      <div className='mb-2 text-sm font-medium text-muted-foreground'>
        2D Mini View
      </div>

      <div className='h-56'>
        <Simulation2DView
          cameras={cameras}
          interactive={false}
          shapes={shapes}
          walls={walls}
          cameraVisions={cameraVisions}
          people={people}
        />
      </div>
    </div>
  )
}

SimulationMiniMap.displayName = 'simulation-mini-map'
