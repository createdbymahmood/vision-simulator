import React from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'

interface SelectionOverlayProps {
  count: number
  onDelete: () => void
  onDuplicate: () => void
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  count,
  onDelete,
  onDuplicate,
}) => {
  if (count === 0) {
    return null
  }

  return (
    <div className='pointer-events-none absolute left-4 top-20 z-30 flex flex-col gap-2'>
      <div className='pointer-events-auto flex items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow'>
        <Badge variant='secondary'>
          {`${count} object${count === 1 ? '' : 's'} selected`}
        </Badge>
        <div className='flex items-center gap-1'>
          <Button size='sm' variant='ghost' onClick={onDelete}>
            Delete
          </Button>
          <Button size='sm' variant='ghost' onClick={onDuplicate}>
            Duplicate
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              /* grouping placeholder */
            }}
          >
            Group
          </Button>
        </div>
      </div>
    </div>
  )
}
