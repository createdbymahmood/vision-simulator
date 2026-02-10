import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {RadarSettings} from '@/features/scene/infrastructure/stores/ui.store'

import {clamp} from './simulation-radar-helpers'

interface UseRadarInteractionsInput {
  radarSettings: RadarSettings
  setRadarSettings: (settings: Partial<RadarSettings>) => void
}

export const useRadarInteractions = ({
  radarSettings,
  setRadarSettings,
}: UseRadarInteractionsInput) => {
  const zoomMin = 0.5
  const zoomMax = 10
  const interactionRef = React.useRef<HTMLDivElement | null>(null)
  const panRef = React.useRef<{
    startX: number
    startY: number
    panX: number
    panY: number
  } | null>(null)

  const handleWheelDelta = useCallbackRef((deltaY: number) => {
    const delta = deltaY > 0 ? -0.1 : 0.1
    setRadarSettings({
      zoom: clamp(radarSettings.zoom + delta, zoomMin, zoomMax),
    })
  })

  React.useEffect(() => {
    const element = interactionRef.current
    if (!element) {
      return
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      handleWheelDelta(event.deltaY)
    }
    element.addEventListener('wheel', handleWheel, {passive: false})
    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheelDelta])

  const handlePanStart = useCallbackRef((event: React.PointerEvent) => {
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: radarSettings.pan.x,
      panY: radarSettings.pan.y,
    }
    const handleMove = (moveEvent: PointerEvent) => {
      if (!panRef.current) {
        return
      }
      setRadarSettings({
        pan: {
          x: panRef.current.panX + moveEvent.clientX - panRef.current.startX,
          y: panRef.current.panY + moveEvent.clientY - panRef.current.startY,
        },
      })
    }
    const handleUp = () => {
      panRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  })

  return {
    interactionRef,
    handlePanStart,
  }
}
