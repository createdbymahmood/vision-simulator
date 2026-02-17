import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import type {RadarSettings} from '@/features/scene/infrastructure/stores/ui.store'

import {clamp} from './simulation-radar-helpers'

interface UseRadarInteractionsInput {
  enabled?: boolean
  radarSettings: RadarSettings
  setRadarSettings: (settings: Partial<RadarSettings>) => void
}

// eslint-disable-next-line max-lines-per-function
export const useRadarInteractions = ({
  enabled = true,
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
  const panValueRef = React.useRef(radarSettings.pan)
  const zoomValueRef = React.useRef(radarSettings.zoom)
  const wheelAccumulatorRef = React.useRef(0)
  const wheelFrameRef = React.useRef<number | null>(null)
  const panFrameRef = React.useRef<number | null>(null)
  const latestPointerEventRef = React.useRef<PointerEvent | null>(null)

  React.useEffect(() => {
    zoomValueRef.current = radarSettings.zoom
  }, [radarSettings.zoom])

  React.useEffect(() => {
    panValueRef.current = radarSettings.pan
  }, [radarSettings.pan])

  const flushWheel = useCallbackRef(() => {
    wheelFrameRef.current = null

    if (!enabled) {
      wheelAccumulatorRef.current = 0
      return
    }

    const accumulatedDelta = wheelAccumulatorRef.current
    wheelAccumulatorRef.current = 0

    if (!accumulatedDelta) {
      return
    }

    const direction = accumulatedDelta > 0 ? -1 : 1
    const magnitude = clamp(Math.abs(accumulatedDelta) / 600, 0.05, 0.35)
    const nextZoom = clamp(
      zoomValueRef.current + direction * magnitude,
      zoomMin,
      zoomMax,
    )

    if (nextZoom === zoomValueRef.current) {
      return
    }

    zoomValueRef.current = nextZoom
    setRadarSettings({zoom: nextZoom})
  })

  const scheduleWheelDelta = useCallbackRef((deltaY: number) => {
    if (!enabled) {
      return
    }

    wheelAccumulatorRef.current += deltaY

    if (wheelFrameRef.current != null) {
      return
    }

    wheelFrameRef.current = window.requestAnimationFrame(flushWheel)
  })

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const element = interactionRef.current
    if (!element) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      scheduleWheelDelta(event.deltaY)
    }

    element.addEventListener('wheel', handleWheel, {passive: false})

    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [enabled, scheduleWheelDelta])

  const flushPan = useCallbackRef(() => {
    panFrameRef.current = null

    if (!enabled || !panRef.current || !latestPointerEventRef.current) {
      return
    }

    const nextPan = {
      x:
        panRef.current.panX +
        latestPointerEventRef.current.clientX -
        panRef.current.startX,
      y:
        panRef.current.panY +
        latestPointerEventRef.current.clientY -
        panRef.current.startY,
    }

    if (
      nextPan.x === panValueRef.current.x &&
      nextPan.y === panValueRef.current.y
    ) {
      return
    }

    panValueRef.current = nextPan
    setRadarSettings({pan: nextPan})
  })

  const handlePanStart = useCallbackRef((event: React.PointerEvent) => {
    if (!enabled) {
      return
    }

    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panX: panValueRef.current.x,
      panY: panValueRef.current.y,
    }

    latestPointerEventRef.current = null

    const handleMove = (moveEvent: PointerEvent) => {
      if (!panRef.current) {
        return
      }

      latestPointerEventRef.current = moveEvent

      if (panFrameRef.current != null) {
        return
      }

      panFrameRef.current = window.requestAnimationFrame(flushPan)
    }

    const handleUp = () => {
      if (panFrameRef.current != null) {
        window.cancelAnimationFrame(panFrameRef.current)
        panFrameRef.current = null
      }

      flushPan()

      latestPointerEventRef.current = null
      panRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  })

  React.useEffect(
    () => () => {
      if (wheelFrameRef.current != null) {
        window.cancelAnimationFrame(wheelFrameRef.current)
        wheelFrameRef.current = null
      }

      if (panFrameRef.current != null) {
        window.cancelAnimationFrame(panFrameRef.current)
        panFrameRef.current = null
      }
    },
    [],
  )

  return {
    interactionRef,
    handlePanStart,
  }
}
