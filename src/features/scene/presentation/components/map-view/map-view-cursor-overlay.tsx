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
      className='pointer-events-none absolute inset-0 z-20'
      style={{cursor: 'none'}}
    >
      <div
        className='absolute'
        style={{left: cursorPoint.x, top: cursorPoint.y}}
      >
        <div className='relative -translate-x-1/2 -translate-y-1/2'>
          <div className='absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-emerald-500/80 shadow' />
          <div className='absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/80 shadow' />
          <div
            className='size-3 rounded-full shadow-md cursor-dot'
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
