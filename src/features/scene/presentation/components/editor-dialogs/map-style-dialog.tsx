import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MapStyleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MapStyleDialog: React.FC<MapStyleDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map view</DialogTitle>
          <DialogDescription>
            Toggle between available map styles.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          {['street', 'satellite', 'traffic', 'osm'].map((style) => (
            <div
              className='flex items-center justify-between rounded-lg border px-3 py-2'
              key={style}
            >
              <span className='capitalize'>{style}</span>
              <span className='text-xs text-muted-foreground'>Coming soon</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
