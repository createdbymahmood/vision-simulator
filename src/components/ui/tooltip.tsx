'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const portalContainer = usePortalContainer()

  return (
    <TooltipPrimitive.Portal
      container={resolvePortalContainer(undefined, portalContainer)}
    >
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        data-slot='tooltip-content'
        className={cn(
          'vs:bg-foreground vs:text-background vs:animate-in vs:fade-in-0 vs:zoom-in-95 vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=closed]:zoom-out-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:w-fit vs:origin-(--radix-tooltip-content-transform-origin) vs:rounded-md vs:px-3 vs:py-1.5 vs:text-xs vs:text-balance',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className='vs:bg-foreground vs:fill-foreground vs:z-50 vs:size-2.5 vs:translate-y-[calc(-50%_-_2px)] vs:rotate-45 vs:rounded-[2px]' />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger}
