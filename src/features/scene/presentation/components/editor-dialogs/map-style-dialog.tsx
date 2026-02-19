import React from 'react'

import type {SceneMapStyle} from '@/features/scene/domain/types'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {cn} from '@/lib/utils'

interface MapStyleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: SceneMapStyle
  onValueChange: (style: SceneMapStyle) => void
}

export const MapStyleDialog: React.FC<MapStyleDialogProps> = ({
  open,
  onOpenChange,
  value,
  onValueChange,
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
        <RadioGroup
          className='vs:gap-2'
          value={value}
          onValueChange={(nextValue) =>
            onValueChange(nextValue as SceneMapStyle)
          }
        >
          {(['street', 'satellite', 'traffic', 'osm'] as SceneMapStyle[]).map(
            (style) => {
              const optionId = `map-style-${style}`
              return (
                <label
                  key={style}
                  htmlFor={optionId}
                  className={cn(
                    'vs:flex vs:cursor-pointer vs:items-center vs:justify-between vs:rounded-lg vs:border vs:px-3 vs:py-2 vs:text-sm vs:transition-colors vs:hover:bg-muted/50',
                    style === value && 'vs:border-primary vs:bg-muted/40',
                  )}
                >
                  <span className='vs:capitalize'>{style}</span>
                  <RadioGroupItem id={optionId} value={style} />
                </label>
              )
            },
          )}
        </RadioGroup>
      </DialogContent>
    </Dialog>
  )
}
