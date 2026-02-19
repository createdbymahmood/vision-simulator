'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const portalContainer = usePortalContainer()

  return (
    <PopoverPrimitive.Portal
      container={resolvePortalContainer(undefined, portalContainer)}
    >
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        data-slot='popover-content'
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:w-72 vs:origin-(--radix-popover-content-transform-origin) vs:rounded-md vs:border vs:p-4 vs:shadow-md vs:outline-hidden',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot='popover-anchor' {...props} />
}

export {Popover, PopoverAnchor, PopoverContent, PopoverTrigger}
