import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useBlocker} from '@tanstack/react-router'
import React from 'react'
import {toast} from 'sonner'

import {updateVision} from '@/data-provider/api/services/v2/vision-simulator'
import type {SceneRoot} from '@/features/scene/domain/types'
import type {UnsavedChangesOptions} from '@/features/scene/presentation/leave-guard/types'

import {useSceneDirtyState} from './use-scene-dirty-state'

interface UseEditorUnsavedChangesGuardParams {
  scene: SceneRoot
  visionSimulatorId: string
  unsavedChanges?: UnsavedChangesOptions
}

const DEFAULT_DIALOG_TITLE = 'Unsaved changes'
const DEFAULT_DIALOG_DESCRIPTION =
  'You have unsaved changes. Do you want to save before leaving?'

const useOptionalRouteBlocker = (enabled: boolean, isDirty: boolean) => {
  try {
    return useBlocker({
      shouldBlockFn: () => enabled && isDirty,
      withResolver: true,
      enableBeforeUnload: enabled && isDirty,
    })
  } catch {
    return null
  }
}

export const useEditorUnsavedChangesGuard = ({
  scene,
  visionSimulatorId,
  unsavedChanges,
}: UseEditorUnsavedChangesGuardParams) => {
  const [saveLoading, setSaveLoading] = React.useState(false)
  const [leaveDialogSaving, setLeaveDialogSaving] = React.useState(false)
  const isSavingRef = React.useRef(false)

  const unsavedChangesEnabled = unsavedChanges?.enabled ?? true
  const leaveDialogConfig = React.useMemo(
    () => ({
      title: unsavedChanges?.confirmDialogTitle ?? DEFAULT_DIALOG_TITLE,
      description:
        unsavedChanges?.confirmDialogDescription ?? DEFAULT_DIALOG_DESCRIPTION,
    }),
    [
      unsavedChanges?.confirmDialogDescription,
      unsavedChanges?.confirmDialogTitle,
    ],
  )

  const {createSaveSnapshot, isDirty, markSaved} = useSceneDirtyState({
    enabled: unsavedChangesEnabled,
    scene,
  })

  const routeBlocker = useOptionalRouteBlocker(unsavedChangesEnabled, isDirty)

  const saveScene = useCallbackRef(async () => {
    if (isSavingRef.current) {
      return false
    }

    const sceneToSave = scene
    const saveSnapshot = createSaveSnapshot(sceneToSave)

    isSavingRef.current = true
    setSaveLoading(true)

    try {
      await updateVision(visionSimulatorId, {
        vision: {
          data: sceneToSave,
        },
      })

      markSaved(saveSnapshot)
      toast.success('Scene saved')
      return true
    } catch {
      toast.error('Failed to save scene')
      return false
    } finally {
      isSavingRef.current = false
      setSaveLoading(false)
    }
  })

  const onConfirmSaveAndLeave = useCallbackRef(async () => {
    if (!routeBlocker || routeBlocker.status !== 'blocked') {
      return
    }

    setLeaveDialogSaving(true)

    const saved = await saveScene()

    if (!saved) {
      setLeaveDialogSaving(false)
      return
    }

    routeBlocker.proceed()
  })

  const onConfirmDiscardAndLeave = useCallbackRef(() => {
    if (!routeBlocker || routeBlocker.status !== 'blocked') {
      return
    }

    routeBlocker.proceed()
  })

  const onConfirmStay = useCallbackRef(() => {
    if (!routeBlocker || routeBlocker.status !== 'blocked') {
      return
    }

    routeBlocker.reset()
  })

  React.useEffect(() => {
    if (routeBlocker?.status !== 'blocked') {
      setLeaveDialogSaving(false)
    }
  }, [routeBlocker?.status])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (routeBlocker) {
      return
    }

    if (!unsavedChangesEnabled || !isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, routeBlocker, unsavedChangesEnabled])

  React.useEffect(() => {
    unsavedChanges?.onDirtyStateChange?.({
      isDirty,
      isSaving: saveLoading || leaveDialogSaving,
    })
  }, [isDirty, leaveDialogSaving, saveLoading, unsavedChanges])

  return {
    saveLoading,
    saveScene,
    leaveDialogState: {
      open: routeBlocker?.status === 'blocked',
      isSaving: leaveDialogSaving,
    },
    leaveDialogConfig,
    onConfirmSaveAndLeave,
    onConfirmDiscardAndLeave,
    onConfirmStay,
  }
}
