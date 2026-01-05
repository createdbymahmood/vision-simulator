import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DevicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceCount: number
}

export const DevicesDialog: React.FC<DevicesDialogProps> = ({
  open,
  onOpenChange,
  deviceCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devices in use</DialogTitle>
          <DialogDescription>
            Quick glance at cameras placed in the scene.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
            <span className='text-sm text-muted-foreground'>Cameras</span>
            <span className='text-sm font-semibold'>{deviceCount}</span>
          </div>
          <p className='text-sm text-muted-foreground'>
            Device details will appear here in the next phase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
