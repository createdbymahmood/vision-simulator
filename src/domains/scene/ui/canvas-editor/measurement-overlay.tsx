import type React from 'react'

import {ArrowLeftRightIcon, RulerIcon} from 'lucide-react'

import type {CanvasMeasurement} from './types'

interface MeasurementOverlayProps {
  measurement: CanvasMeasurement
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  measurement,
}) => {
  return (
    <div
      className='pointer-events-none absolute rounded-md border bg-white/90 px-3 py-2 text-xs shadow-sm'
      style={{
        left: measurement.screen.x + 12,
        top: measurement.screen.y + 12,
      }}
    >
      <div className='flex items-center gap-2'>
        <RulerIcon className='size-3.5' />
        <span>{measurement.length.toFixed(2)} m</span>
      </div>
      <div className='flex items-center gap-2'>
        <ArrowLeftRightIcon className='size-3.5' />
        <span>{measurement.angle.toFixed(1)}°</span>
      </div>
    </div>
  )
}
