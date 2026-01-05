import type {ReferenceType} from '@floating-ui/react'

import {offset, shift, useFloating} from '@floating-ui/react'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {TooltipState} from './map-view-types'

interface MapViewTooltipProps {
  tooltip: TooltipState
}

export const MapViewTooltip: React.FC<MapViewTooltipProps> = ({tooltip}) => {
  const virtualRef = React.useMemo(
    () => ({
      getBoundingClientRect: () => new DOMRect(tooltip.x, tooltip.y, 0, 0),
    }),
    [tooltip.x, tooltip.y],
  )

  const {refs, floatingStyles, update} = useFloating({
    open: tooltip.visible,
    placement: 'top-start',
    middleware: [offset(-32), shift({padding: 8})],
    strategy: 'fixed',
  })

  const cb = useCallbackRef(() => {
    refs.setReference(virtualRef as ReferenceType)
    update?.()
  })

  React.useEffect(cb, [refs, update, virtualRef, tooltip.visible])

  if (!tooltip.visible) {
    return null
  }

  return (
    <div
      className='pointer-events-none z-50 transition-opacity duration-200'
      ref={refs.setFloating}
      style={floatingStyles}
    >
      <div className='rounded-full bg-black/60 px-3 py-2 text-xs text-white shadow-lg backdrop-blur tabular-nums'>
        {tooltip.text}
      </div>
    </div>
  )
}
