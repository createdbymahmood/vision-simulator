import React from 'react'

import type {CursorPoint} from './map-view-types'

interface MapViewCursorOverlayProps {
  cursorPoint: CursorPoint
  color: string
}

export const MapViewCursorOverlay: React.FC<MapViewCursorOverlayProps> = ({
  cursorPoint,
  color,
}) => {
  return (
    <div
      className='vs:pointer-events-none vs:absolute vs:inset-0 vs:z-20'
      style={{cursor: 'none'}}
    >
      <div
        className='vs:absolute'
        style={{left: cursorPoint.x, top: cursorPoint.y}}
      >
        <div className='vs:relative vs:-translate-x-1/2 vs:-translate-y-1/2'>
          <div className='vs:absolute vs:left-1/2 vs:top-1/2 vs:h-6 vs:w-px vs:-translate-x-1/2 vs:-translate-y-1/2 vs:bg-emerald-500/80 vs:shadow' />
          <div className='vs:absolute vs:left-1/2 vs:top-1/2 vs:h-px vs:w-6 vs:-translate-x-1/2 vs:-translate-y-1/2 vs:bg-emerald-500/80 vs:shadow' />
          <div
            className='vs:size-3 vs:rounded-full vs:shadow-md cursor-dot'
            style={{
              backgroundColor: color,
              opacity: 0.8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
