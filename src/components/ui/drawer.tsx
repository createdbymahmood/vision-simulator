'use client'

import * as React from 'react'
import {Drawer as DrawerPrimitive} from 'vaul'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Drawer({...props}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot='drawer' {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot='drawer-trigger' {...props} />
}

function DrawerPortal({
  container,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <DrawerPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='drawer-portal'
      {...props}
    />
  )
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot='drawer-close' {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot='drawer-overlay'
      className={cn(
        'vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:fixed vs:inset-0 vs:z-50 vs:bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot='drawer-portal'>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot='drawer-content'
        className={cn(
          'vs:group/drawer-content vs:bg-background vs:fixed vs:z-50 vs:flex vs:h-auto vs:flex-col',
          'vs:data-[vaul-drawer-direction=top]:inset-x-0 vs:data-[vaul-drawer-direction=top]:top-0 vs:data-[vaul-drawer-direction=top]:mb-24 vs:data-[vaul-drawer-direction=top]:max-h-[80vh] vs:data-[vaul-drawer-direction=top]:rounded-b-lg vs:data-[vaul-drawer-direction=top]:border-b',
          'vs:data-[vaul-drawer-direction=bottom]:inset-x-0 vs:data-[vaul-drawer-direction=bottom]:bottom-0 vs:data-[vaul-drawer-direction=bottom]:mt-24 vs:data-[vaul-drawer-direction=bottom]:max-h-[80vh] vs:data-[vaul-drawer-direction=bottom]:rounded-t-lg vs:data-[vaul-drawer-direction=bottom]:border-t',
          'vs:data-[vaul-drawer-direction=right]:inset-y-0 vs:data-[vaul-drawer-direction=right]:right-0 vs:data-[vaul-drawer-direction=right]:w-3/4 vs:data-[vaul-drawer-direction=right]:border-l vs:data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'vs:data-[vaul-drawer-direction=left]:inset-y-0 vs:data-[vaul-drawer-direction=left]:left-0 vs:data-[vaul-drawer-direction=left]:w-3/4 vs:data-[vaul-drawer-direction=left]:border-r vs:data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className,
        )}
        {...props}
      >
        <div className='vs:bg-muted vs:mx-auto vs:mt-4 vs:hidden vs:h-2 vs:w-[100px] vs:shrink-0 vs:rounded-full vs:group-data-[vaul-drawer-direction=bottom]/drawer-content:block' />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-header'
      className={cn(
        'vs:flex vs:flex-col vs:gap-0.5 vs:p-4 vs:group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center vs:group-data-[vaul-drawer-direction=top]/drawer-content:text-center vs:md:gap-1.5 vs:md:text-left',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='drawer-footer'
      className={cn(
        'vs:mt-auto vs:flex vs:flex-col vs:gap-2 vs:p-4',
        className,
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn('vs:text-foreground vs:font-semibold', className)}
      data-slot='drawer-title'
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn('vs:text-muted-foreground vs:text-sm', className)}
      data-slot='drawer-description'
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
}
