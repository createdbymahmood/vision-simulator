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

  React.useEffect(cb, [cb, refs, update, virtualRef, tooltip.visible])

  if (!tooltip.visible) {
    return null
  }

  return (
    <div
      className='vs:pointer-events-none vs:z-50 vs:transition-opacity vs:duration-200'
      ref={refs.setFloating}
      style={floatingStyles}
    >
      <div className='vs:rounded-full vs:bg-black/60 vs:px-3 vs:py-2 vs:text-xs vs:text-white vs:shadow-lg vs:backdrop-blur vs:tabular-nums'>
        {tooltip.text}
      </div>
    </div>
  )
}
