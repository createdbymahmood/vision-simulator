import React from 'react'
import {useCallbackRef} from '@radix-ui/react-use-callback-ref'

import type {RadarSettings} from '@/features/scene/infrastructure/stores/ui.store'

import {clamp} from './simulation-radar-helpers'

interface UseRadarInteractionsInput {
  radarSettings: RadarSettings
  setRadarSettings: (settings: Partial<RadarSettings>) => void
  containerRef?: React.RefObject<HTMLDivElement>
}

export const useRadarInteractions = ({
  radarSettings,
  setRadarSettings,
  containerRef,
}: UseRadarInteractionsInput) => {
  const dragRef = React.useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const resizeRef = React.useRef<{
    startX: number
    startY: number
    width: number
    height: number
  } | null>(null)

  const panRef = React.useRef<{
    startX: number
    startY: number
    panX: number
    panY: number
  } | null>(null)

  const panelRef = React.useRef<HTMLDivElement>(null)

  const snapToCorner = useCallbackRef(() => {
    if (!containerRef?.current || !panelRef.current) {
      return
    }
    const containerRect = containerRef.current.getBoundingClientRect()
    const panelRect = panelRef.current.getBoundingClientRect()
    const margin = 16
    const maxX = Math.max(containerRect.width - panelRect.width - margin, margin)
    const maxY = Math.max(
      containerRect.height - panelRect.height - margin,
      margin,
    )
    const corners = [
      {x: margin, y: margin},
      {x: maxX, y: margin},
      {x: margin, y: maxY},
      {x: maxX, y: maxY},
    ]
    const current = radarSettings.position
    const nearest = corners.reduce(
      (result, corner) => {
        const distance = Math.hypot(
          current.x - corner.x,
          current.y - corner.y,
        )
        if (distance < result.distance) {
          return {corner, distance}
        }
        return result
      },
      {corner: corners[0], distance: Number.POSITIVE_INFINITY},
    )
    if (nearest.distance < 48) {
      setRadarSettings({position: nearest.corner})
    }
  })

  const handleWheel = useCallbackRef((event: React.WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    setRadarSettings({
      zoom: clamp(radarSettings.zoom + delta, 0.5, 3),
    })
  })

  const handleDragStart = useCallbackRef((event: React.PointerEvent) => {
    if (radarSettings.isLocked) {
      return
    }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: radarSettings.position.x,
      originY: radarSettings.position.y,
    }
    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) {
        return
      }
      const nextX =
        dragRef.current.originX + moveEvent.clientX - dragRef.current.startX
      const nextY =
        dragRef.current.originY + moveEvent.clientY - dragRef.current.startY
      setRadarSettings({position: {x: nextX, y: nextY}})
    }
    const handleUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      snapToCorner()
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  })

  const handleResizeStart = useCallbackRef((event: React.PointerEvent) => {
    if (radarSettings.isLocked) {
      return
    }
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      width: radarSettings.size.width,
      height: radarSettings.size.height,
    }
    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizeRef.current) {
        return
      }
      const nextWidth = clamp(
        resizeRef.current.width + moveEvent.clientX - resizeRef.current.startX,
        200,
        500,
      )
      const nextHeight = clamp(
        resizeRef.current.height +
          moveEvent.clientY -
          resizeRef.current.startY,
        200,
        500,
      )
      setRadarSettings({size: {width: nextWidth, height: nextHeight}})
    }
    const handleUp = () => {
      resizeRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  })

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

  const panelStyle = React.useMemo(
    () => ({
      left: radarSettings.position.x,
      top: radarSettings.position.y,
      width: radarSettings.isMinimized ? 220 : radarSettings.size.width,
      height: radarSettings.isMinimized ? 'auto' : radarSettings.size.height,
    }),
    [
      radarSettings.isMinimized,
      radarSettings.position.x,
      radarSettings.position.y,
      radarSettings.size.height,
      radarSettings.size.width,
    ],
  )

  return {
    handleDragStart,
    handlePanStart,
    handleResizeStart,
    handleWheel,
    panelRef,
    panelStyle,
  }
}
