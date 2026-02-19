import React from 'react'

import {CardHeader, CardTitle} from '@/components/ui/card'
import {Switch} from '@/components/ui/switch'

export type RadarDisplayMode = 'real' | 'simulated'

interface SimulationRadarHeaderProps {
  mode: RadarDisplayMode
  onModeChange: (mode: RadarDisplayMode) => void
}

export const SimulationRadarHeader: React.FC<SimulationRadarHeaderProps> = ({
  mode,
  onModeChange,
}) => (
  <CardHeader>
    <div className='vs:flex vs:items-center vs:justify-between vs:gap-4'>
      <CardTitle>RADAR</CardTitle>
      <div className='vs:flex vs:items-center vs:gap-2'>
        <label
          className='vs:text-xs vs:font-medium vs:text-muted-foreground'
          htmlFor='real-radar-mode'
        >
          Real
        </label>
        <Switch
          checked={mode === 'real'}
          id='real-radar-mode'
          onCheckedChange={(checked) =>
            onModeChange(checked ? 'real' : 'simulated')
          }
        />
      </div>
    </div>
  </CardHeader>
)
