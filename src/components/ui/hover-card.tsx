'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot='hover-card' {...props} />
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot='hover-card-trigger' {...props} />
  )
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  const portalContainer = usePortalContainer()

  return (
    <HoverCardPrimitive.Portal
      container={resolvePortalContainer(undefined, portalContainer)}
      data-slot='hover-card-portal'
    >
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        data-slot='hover-card-content'
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:w-64 vs:origin-(--radix-hover-card-content-transform-origin) vs:rounded-md vs:border vs:p-4 vs:shadow-md vs:outline-hidden',
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export {HoverCard, HoverCardContent, HoverCardTrigger}
