import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useEffect} from 'react'

import type {EditorTool} from '@/features/scene/infrastructure/stores/ui.store'

import type {ShapeDrawMode} from '../types'

interface EditorShortcutOptions {
  isEditMode: boolean
  hasAreas: boolean
  isMapMode: boolean
  onSelectTool: (tool: EditorTool) => void
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
const shapeByKey: Record<string, ShapeDrawMode> = {
  r: 'rectangle',
  c: 'circle',
  t: 'triangle',
  l: 'line',
}

export const useEditorShortcuts = ({
  isEditMode,
  hasAreas,
  isMapMode,
  onSelectTool,
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
  const handleEscapeKey = (event: KeyboardEvent, key: string) => {
    if (key !== 'escape') {
      return false
    }

    event.preventDefault()
    onEscape()
    return true
  }

  const handleMetaShortcuts = (
    event: KeyboardEvent,
    key: string,
    isMeta: boolean,
  ) => {
    if (!isMeta) {
      return false
    }

    if (key === 'k') {
      if (!isMapMode) {
        return true
      }
      event.preventDefault()
      onSearchLocation()
      return true
    }

    if (event.shiftKey && key === 'a') {
      event.preventDefault()
      onOpenAreasPanel()
      return true
    }

    if (event.shiftKey && key === 'd') {
      event.preventDefault()
      onOpenDevicesPanel()
      return true
    }

    if (key === 'z') {
      event.preventDefault()
      if (event.shiftKey) {
        onRedo()
        return true
      }
      onUndo()
      return true
    }

    return false
  }

  const handleToolShortcuts = (event: KeyboardEvent, key: string) => {
    if (!isEditMode) {
      return false
    }

    if (key === 'v') {
      event.preventDefault()
      onSelectTool('select')
      return true
    }

    if (key === 'h') {
      event.preventDefault()
      onSelectTool('hand')
      return true
    }

    if (key === 'a') {
      event.preventDefault()
      onSelectTool('draw-area')
      return true
    }

    if (key === 'w' && hasAreas) {
      event.preventDefault()
      onSelectTool('draw-wall')
      return true
    }

    if (hasAreas && Object.keys(shapeByKey).includes(key)) {
      event.preventDefault()
      onSelectTool('draw-shape')
      onSelectShapeMode(shapeByKey[key])
      return true
    }

    if (key === 'd' && hasAreas) {
      event.preventDefault()
      onSelectTool('place-camera')
      onOpenPlaceDevice()
      return true
    }

    if (key === 'p' && hasAreas) {
      event.preventDefault()
      onSelectTool('place-person')
      onPlacePerson()
      return true
    }

    return false
  }

  const handleKeyDown = useCallbackRef((event: KeyboardEvent) => {
    const key = normalizeKey(event.key)
    const isMeta = event.metaKey || event.ctrlKey

    if (event.repeat) {
      return
    }

    if (handleEscapeKey(event, key)) {
      return
    }

    if (handleMetaShortcuts(event, key, isMeta)) {
      return
    }

    handleToolShortcuts(event, key)
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
