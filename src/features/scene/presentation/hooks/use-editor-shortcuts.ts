import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect} from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import type {AreaCreationMode, ShapeDrawMode} from '../types'

interface EditorShortcutOptions {
  isEditMode: boolean
  hasAreas: boolean
  isMapMode: boolean
  onSelectTool: (tool: EditorTool) => void
  onSelectAreaMode: (mode: AreaCreationMode) => void
  onSelectShapeMode: (mode: ShapeDrawMode) => void
  onOpenPlaceDevice: () => void
  onPlacePerson: () => void
  onSearchLocation: () => void
  onOpenAreasPanel: () => void
  onOpenDevicesPanel: () => void
  onUndo: () => void
  onRedo: () => void
  onEscape: () => void
}

const normalizeKey = (key: string) => key.toLowerCase()

export const useEditorShortcuts = ({
  isEditMode,
  hasAreas,
  isMapMode,
  onSelectTool,
  onSelectAreaMode,
  onSelectShapeMode,
  onOpenPlaceDevice,
  onPlacePerson,
  onSearchLocation,
  onOpenAreasPanel,
  onOpenDevicesPanel,
  onUndo,
  onRedo,
  onEscape,
}: EditorShortcutOptions) => {
  const handleKeyDown = useCallbackRef((event: KeyboardEvent) => {
    const key = normalizeKey(event.key)
    const isMeta = event.metaKey || event.ctrlKey

    if (event.repeat) {
      return
    }

    if (key === 'escape') {
      event.preventDefault()
      onEscape()
      return
    }

    if (isMeta && key === 'k') {
      if (!isMapMode) {
        return
      }
      event.preventDefault()
      onSearchLocation()
      return
    }

    if (isMeta && event.shiftKey && key === 'a') {
      event.preventDefault()
      onOpenAreasPanel()
      return
    }

    if (isMeta && event.shiftKey && key === 'd') {
      event.preventDefault()
      onOpenDevicesPanel()
      return
    }

    if (isMeta && key === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        onRedo()
        return
      }
      onUndo()
      return
    }

    if (!isEditMode) {
      return
    }

    if (key === 'v') {
      event.preventDefault()
      onSelectTool('select')
      return
    }

    if (key === 'h') {
      event.preventDefault()
      onSelectTool('hand')
      return
    }

    if (key === 'a') {
      event.preventDefault()
      onSelectTool('draw-area')
      onSelectAreaMode('point')
      return
    }

    if (key === 'w' && hasAreas) {
      event.preventDefault()
      onSelectTool('draw-wall')
      return
    }

    if (hasAreas && ['c', 'l', 'r', 't'].includes(key)) {
      event.preventDefault()
      onSelectTool('draw-shape')
      const shapeByKey: Record<string, ShapeDrawMode> = {
        r: 'rectangle',
        c: 'circle',
        t: 'triangle',
        l: 'line',
      }
      onSelectShapeMode(shapeByKey[key])
      return
    }

    if (key === 'd' && hasAreas) {
      event.preventDefault()
      onSelectTool('place-camera')
      onOpenPlaceDevice()
      return
    }

    if (key === 'p' && hasAreas) {
      event.preventDefault()
      onSelectTool('place-person')
      onPlacePerson()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
