import React from 'react'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'

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
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen || isSaving) {
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
          <Button disabled={isSaving} variant='ghost' onClick={onStay}>
            Stay
          </Button>
          <Button
            disabled={isSaving}
            variant='outline'
            onClick={onDiscardChanges}
          >
            Discard changes
          </Button>
          <Button
            disabled={isSaving}
            loading={isSaving}
            onClick={onSaveAndLeave}
          >
            Save and leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
