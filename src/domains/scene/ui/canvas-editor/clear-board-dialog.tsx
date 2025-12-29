import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'

interface ClearBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const ClearBoardDialog: React.FC<ClearBoardDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const handleOpenChange = useCallbackRef((nextOpen: boolean) => {
    onOpenChange(nextOpen)
  })

  const handleConfirm = useCallbackRef(() => {
    onConfirm()
  })

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear board?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove all objects, reset history, and clear the canvas
            background.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant='destructive' onClick={handleConfirm}>
            Clear
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

ClearBoardDialog.displayName = 'clear-board-dialog'
