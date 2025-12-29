import type {PointerDownOutsideEvent} from '@radix-ui/react-dismissable-layer'

import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {Separator} from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type {SceneEntity} from '../../core/scene-types'

interface PropertiesSidebarProps {
  open: boolean
  selected: SceneEntity | null
  onClose: () => void
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  open,
  selected,
  onClose,
}) => {
  const handleOpenChange = useCallbackRef((nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  })

  const handlePointerDownOutside = useCallbackRef(
    (event: PointerDownOutsideEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-canvas-surface]')) {
        event.preventDefault()
      }
    },
  )

  return (
    <Sheet modal={false} onOpenChange={handleOpenChange} open={open}>
      <SheetContent
        side='right'
        onPointerDownOutside={handlePointerDownOutside}
      >
        <SheetHeader>
          <SheetTitle>Properties</SheetTitle>
          <SheetDescription>
            Contextual inspector driven by scene selection.
          </SheetDescription>
        </SheetHeader>
        {selected ? (
          <div className='space-y-4 px-4'>
            <div className='text-sm font-medium'>
              {selected.id} ({(selected as {type?: string}).type ?? 'entity'})
            </div>
            <Separator />
            <pre className='text-xs leading-6'>
              {JSON.stringify(selected, null, 2)}
            </pre>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Nothing selected. Click an entity chip or the workspace to close.
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}

PropertiesSidebar.displayName = 'properties-sidebar'
