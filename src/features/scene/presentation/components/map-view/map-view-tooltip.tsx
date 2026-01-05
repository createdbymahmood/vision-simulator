import React from 'react'

import type {TooltipState} from './map-view-types'

interface MapViewTooltipProps {
  tooltip: TooltipState
}

export const MapViewTooltip: React.FC<MapViewTooltipProps> = ({tooltip}) => {
  return (
    <div
      className='pointer-events-none fixed z-50 transition-opacity duration-200'
      style={{
        left: tooltip.x,
        top: tooltip.y,
        opacity: tooltip.visible ? 1 : 0,
      }}
    >
      <div className='relative rounded-md bg-black/85 px-3 py-2 text-[13px] font-bold text-white shadow-lg backdrop-blur'>
        {tooltip.text}
      </div>
    </div>
  )
}
