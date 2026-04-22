import React from 'react'

import {CardHeader, CardTitle} from '@/components/ui/card'

export type RadarDisplayMode = 'simulated'

export const SimulationRadarHeader: React.FC = () => (
  <CardHeader>
    <div className='vs:flex vs:items-center vs:justify-between vs:gap-4'>
      <CardTitle>RADAR</CardTitle>
    </div>
  </CardHeader>
)
