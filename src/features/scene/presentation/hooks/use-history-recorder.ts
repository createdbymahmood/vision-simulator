import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {debounce} from '@lodash-es'

import {describeHistoryAction} from '@/features/scene/application/history/history-actions'
import type {HistoryAction} from '@/features/scene/application/history/history-actions'
import type {SceneRoot} from '@/features/scene/domain/types'
import {useHistoryStore} from '@/features/scene/infrastructure/stores/history.store'

const DEFAULT_DEBOUNCE_MS = 300

interface DebouncePayload {
  action: HistoryAction
  scene: SceneRoot
}

interface DebounceEntry {
  delay: number
  debounced: ReturnType<typeof debounce>
}

export const useHistoryRecorder = () => {
  const record = useHistoryStore((state) => state.record)

  const debounceMapRef = React.useRef(new Map<string, DebounceEntry>())

  const recordAction = useCallbackRef(
    (action: HistoryAction, scene: SceneRoot) => {
      record(scene, describeHistoryAction(action))
    },
  )

  const recordActionDebounced = useCallbackRef(
    (
      key: string,
      action: HistoryAction,
      scene: SceneRoot,
      delay: number = DEFAULT_DEBOUNCE_MS,
    ) => {
      const existing = debounceMapRef.current.get(key)
      if (!existing || existing.delay !== delay) {
        existing?.debounced.cancel()
        const debounced = debounce((payload: DebouncePayload) => {
          record(payload.scene, describeHistoryAction(payload.action))
        }, delay)
        debounceMapRef.current.set(key, {delay, debounced})
      }

      debounceMapRef.current.get(key)?.debounced({action, scene})
    },
  )

  React.useEffect(
    () => () => {
      debounceMapRef.current.forEach((entry) => entry.debounced.cancel())
      debounceMapRef.current.clear()
    },
    [],
  )

  return {recordAction, recordActionDebounced}
}
