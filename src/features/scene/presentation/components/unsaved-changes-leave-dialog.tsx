import React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UnsavedChangesLeaveDialogProps {
  open: boolean
  title: string
  description: string
  isSaving: boolean
  onSaveAndLeave: () => void
  onDiscardChanges: () => void
  onStay: () => void
}

export const UnsavedChangesLeaveDialog: React.FC<
  UnsavedChangesLeaveDialogProps
> = ({
  open,
  title,
  description,
  isSaving,
  onSaveAndLeave,
  onDiscardChanges,
  onStay,
}) => {
  const actionCloseRef = React.useRef(false)

  const handleStay = () => {
    actionCloseRef.current = true
    onStay()
  }

  const handleDiscardChanges = () => {
    actionCloseRef.current = true
    onDiscardChanges()
  }

  const handleSaveAndLeave = () => {
    actionCloseRef.current = true
    onSaveAndLeave()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen || isSaving) {
      return
    }

    if (actionCloseRef.current) {
      actionCloseRef.current = false
      return
    }

    onStay()
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving} onClick={handleStay}>
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving}
            variant='destructive'
            onClick={handleDiscardChanges}
          >
            Discard changes
          </AlertDialogAction>
          <AlertDialogAction disabled={isSaving} onClick={handleSaveAndLeave}>
            {isSaving ? 'Saving...' : 'Save and leave'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
