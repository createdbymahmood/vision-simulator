import React from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

interface UseMapViewHotkeysParams {
  enabled?: boolean
  activeTool: EditorTool
  isEditMode: boolean
  wallDrawingActive: boolean
  shapeDrawingActive: boolean
  onEscape: () => void
  onAreaBackspace: () => void
  onAreaEnter: () => void
  onWallBackspace: () => void
  onWallEnter: () => void
  onShapeBackspace: () => void
}

export const useMapViewHotkeys = ({
  enabled = true,
  activeTool,
  isEditMode,
  wallDrawingActive,
  shapeDrawingActive,
  onEscape,
  onAreaBackspace,
  onAreaEnter,
  onWallBackspace,
  onWallEnter,
  onShapeBackspace,
}: UseMapViewHotkeysParams) => {
  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }
      if (!isEditMode) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }

      if (activeTool === 'draw-area') {
        if (event.key === 'Backspace') {
          event.preventDefault()
          onAreaBackspace()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          onAreaEnter()
        }
        return
      }

      if (activeTool === 'draw-wall' && wallDrawingActive) {
        if (event.key === 'Backspace') {
          event.preventDefault()
          onWallBackspace()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          onWallEnter()
        }
        return
      }

      if (activeTool === 'draw-shape' && shapeDrawingActive) {
        if (event.key === 'Backspace') {
          event.preventDefault()
          onShapeBackspace()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeTool,
    enabled,
    isEditMode,
    onAreaBackspace,
    onAreaEnter,
    onEscape,
    onShapeBackspace,
    onWallBackspace,
    onWallEnter,
    shapeDrawingActive,
    wallDrawingActive,
  ])
}
