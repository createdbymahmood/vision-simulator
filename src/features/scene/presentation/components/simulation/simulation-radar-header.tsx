import React from 'react'
import {Maximize2, Minus} from 'lucide-react'

import {Button} from '@/components/ui/button'
import {CardAction, CardHeader, CardTitle} from '@/components/ui/card'

interface SimulationRadarHeaderProps {
  isMinimized: boolean
  onToggleMinimize: () => void
  onDragStart: (event: React.PointerEvent) => void
}

export const SimulationRadarHeader: React.FC<SimulationRadarHeaderProps> = ({
  isMinimized,
  onToggleMinimize,
  onDragStart,
}) => (
  <CardHeader onPointerDown={onDragStart}>
    <CardTitle>RADAR</CardTitle>
    <CardAction>
      <Button size='icon' variant='ghost' onClick={onToggleMinimize}>
        {isMinimized ? (
          <Maximize2 className='size-4' />
        ) : (
          <Minus className='size-4' />
        )}
      </Button>
    </CardAction>
  </CardHeader>
)
