import React from 'react'

import type {
  SceneCamera,
  ScenePerson,
  SceneShape,
  SceneWall,
} from '../../core/scene-types'

import {Simulation2DView} from './simulation-2d-view'

interface SimulationMiniMapProps {
  walls: SceneWall[]
  shapes: SceneShape[]
  people: ScenePerson[]
  cameras: SceneCamera[]
}

export const SimulationMiniMap: React.FC<SimulationMiniMapProps> = ({
  walls,
  shapes,
  people,
  cameras,
}) => {
  return (
    <div className='rounded-lg border bg-muted p-3'>
      <div className='mb-2 text-sm font-medium text-muted-foreground'>
        2D Mini View
      </div>

      <div className='h-56'>
        <Simulation2DView
          cameras={cameras}
          shapes={shapes}
          walls={walls}
          people={people}
        />
      </div>
    </div>
  )
}

SimulationMiniMap.displayName = 'simulation-mini-map'
