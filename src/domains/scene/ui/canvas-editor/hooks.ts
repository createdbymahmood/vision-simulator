import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'

import type {CanvasSize} from './types'

export function useElementSize<T extends HTMLElement>(): [
  (node: T | null) => void,
  CanvasSize,
] {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<CanvasSize>({width: 0, height: 0})
  const [element, setElement] = useState<T | null>(null)

  const callbackRef = useCallback((node: T | null) => {
    ref.current = node
    setElement(node)
  }, [])

  useLayoutEffect(() => {
    if (!element) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry?.contentRect) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(element)
    setSize({
      width: element.clientWidth,
      height: element.clientHeight,
    })
    return () => observer.disconnect()
  }, [element])

  return [callbackRef, size]
}

export const useUndoRedoShortcuts = (
  onUndo: () => void,
  onRedo: () => void,
): void => {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        (target as HTMLElement | null)?.isContentEditable

      if (isInput) {
        return
      }

      const isMeta = event.metaKey || event.ctrlKey
      if (!isMeta) {
        return
      }
      const key = event.key.toLowerCase()
      if (event.shiftKey && key === 'z') {
        event.preventDefault()
        onRedo()
        return
      }
      if (key === 'z') {
        event.preventDefault()
        onUndo()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [onRedo, onUndo])
}
