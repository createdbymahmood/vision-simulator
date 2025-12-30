import React from 'react'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

import type {SceneCamera} from '../../core/scene-types'

interface CameraTilesProps {
  cameras: SceneCamera[]
}

export const CameraTiles: React.FC<CameraTilesProps> = ({cameras}) => {
  return (
    <div className='space-y-2'>
      <div className='text-sm font-medium text-muted-foreground'>
        Camera POV
      </div>
      <div className='grid grid-cols-1 gap-2'>
        {cameras.map((camera) => (
          <Card key={camera.id}>
            <CardHeader className='py-2'>
              <CardTitle className='text-sm font-semibold'>
                Camera {camera.id.slice(0, 4)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-24 rounded-md bg-muted' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

CameraTiles.displayName = 'camera-tiles'
