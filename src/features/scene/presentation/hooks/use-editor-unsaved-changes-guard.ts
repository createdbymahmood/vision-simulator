import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import {useBlocker} from '@tanstack/react-router'
import React from 'react'
import {toast} from 'sonner'

import type {SceneRoot} from '@/features/scene/domain/types'
import type {UnsavedChangesOptions} from '@/features/scene/presentation/leave-guard/types'

import {updateVision} from '@/data-provider/api/services/v2/vision-simulator'

import {useSceneDirtyState} from './use-scene-dirty-state'

interface UseEditorUnsavedChangesGuardParams {
  scene: SceneRoot
  visionSimulatorId: string
  unsavedChanges?: UnsavedChangesOptions
}

const isPrimaryUnmodifiedClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey

const resolveAnchorNavigationHref = (
  anchorElement: HTMLAnchorElement,
): string | null => {
  if (anchorElement.hasAttribute('download')) {
    return null
  }

  const target = anchorElement.getAttribute('target')

  if (target && target !== '_self') {
    return null
  }

  const href = anchorElement.getAttribute('href')

  if (!href || href.startsWith('#')) {
    return null
  }

  const nextUrl = new URL(anchorElement.href, window.location.href)
  const currentUrl = new URL(window.location.href)

  if (nextUrl.href === currentUrl.href) {
    return null
  }

  return nextUrl.href
}

interface UseManualAnchorNavigationBlockerParams {
  enabled: boolean
  isDirty: boolean
  isRouteBlockerAvailable: boolean
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

const useManualAnchorNavigationBlocker = ({
  enabled,
  isDirty,
  isRouteBlockerAvailable,
}: UseManualAnchorNavigationBlockerParams) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const pendingNavigationHrefRef = React.useRef<string | null>(null)

  const reset = useCallbackRef(() => {
    pendingNavigationHrefRef.current = null
    setIsOpen(false)
  })

  const proceed = useCallbackRef(() => {
    const pendingHref = pendingNavigationHrefRef.current

    if (!pendingHref) {
      return false
    }

    reset()
    window.location.assign(pendingHref)
    return true
  })

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    if (isRouteBlockerAvailable || !enabled || !isDirty) {
      return
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isPrimaryUnmodifiedClick(event)) {
        return
      }

      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchorElement = target.closest('a[href]')

      if (!(anchorElement instanceof HTMLAnchorElement)) {
        return
      }

      const pendingHref = resolveAnchorNavigationHref(anchorElement)

      if (!pendingHref) {
        return
      }

      event.preventDefault()
      pendingNavigationHrefRef.current = pendingHref
      setIsOpen(true)
    }

    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [enabled, isDirty, isRouteBlockerAvailable])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isRouteBlockerAvailable || !enabled || !isDirty) {
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
  }, [enabled, isDirty, isRouteBlockerAvailable])

  React.useEffect(() => {
    if (isDirty && enabled && !isRouteBlockerAvailable) {
      return
    }

    pendingNavigationHrefRef.current = null
    setIsOpen(false)
  }, [enabled, isDirty, isRouteBlockerAvailable])

  return {
    isOpen,
    reset,
    proceed,
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
  const isRouteLeaveDialogOpen = routeBlocker?.status === 'blocked'
  const {
    isOpen: manualLeaveDialogOpen,
    proceed: proceedManualNavigation,
    reset: resetManualNavigation,
  } = useManualAnchorNavigationBlocker({
    enabled: unsavedChangesEnabled,
    isDirty,
    isRouteBlockerAvailable: Boolean(routeBlocker),
  })

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
    if (!isRouteLeaveDialogOpen && !manualLeaveDialogOpen) {
      return
    }

    setLeaveDialogSaving(true)

    const saved = await saveScene()

    if (!saved) {
      setLeaveDialogSaving(false)
      return
    }

    if (routeBlocker && routeBlocker.status === 'blocked') {
      routeBlocker.proceed()
      return
    }

    proceedManualNavigation()
  })

  const onConfirmDiscardAndLeave = useCallbackRef(() => {
    if (routeBlocker && routeBlocker.status === 'blocked') {
      routeBlocker.proceed()
      return
    }

    proceedManualNavigation()
  })

  const onConfirmStay = useCallbackRef(() => {
    if (routeBlocker && routeBlocker.status === 'blocked') {
      routeBlocker.reset()
      return
    }

    resetManualNavigation()
  })

  React.useEffect(() => {
    if (!isRouteLeaveDialogOpen && !manualLeaveDialogOpen) {
      setLeaveDialogSaving(false)
    }
  }, [isRouteLeaveDialogOpen, manualLeaveDialogOpen])

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
      open: isRouteLeaveDialogOpen || manualLeaveDialogOpen,
      isSaving: leaveDialogSaving,
    },
    leaveDialogConfig,
    onConfirmSaveAndLeave,
    onConfirmDiscardAndLeave,
    onConfirmStay,
  }
}
