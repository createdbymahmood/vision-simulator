import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Separator} from '@/components/ui/separator'

interface AreaManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  areaCount: number
}

export const AreaManagementDialog: React.FC<AreaManagementDialogProps> = ({
  open,
  onOpenChange,
  areaCount,
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Areas</DialogTitle>
          <DialogDescription>
            Create and manage areas before using dependent tools.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
            <span className='text-sm text-muted-foreground'>Total areas</span>
            <span className='text-sm font-semibold'>{areaCount}</span>
          </div>
          <p className='text-sm text-muted-foreground'>
            Add areas in the bottom navigation to unlock walls, shapes, and
            device placement.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
