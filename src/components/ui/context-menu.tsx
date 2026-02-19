'use client'

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import {CheckIcon, ChevronRightIcon, CircleIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot='context-menu' {...props} />
}

function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot='context-menu-trigger' {...props} />
  )
}

function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot='context-menu-group' {...props} />
  )
}

function ContextMenuPortal({
  container,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <ContextMenuPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='context-menu-portal'
      {...props}
    />
  )
}

function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot='context-menu-sub' {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot='context-menu-radio-group'
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-inset={inset}
      data-slot='context-menu-sub-trigger'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[state=open]:bg-accent vs:data-[state=open]:text-accent-foreground vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:flex vs:cursor-default vs:items-center vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[inset]:pl-8 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className='vs:ml-auto' />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot='context-menu-sub-content'
      className={cn(
        'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:min-w-[8rem] vs:origin-(--radix-context-menu-content-transform-origin) vs:overflow-hidden vs:rounded-md vs:border vs:p-1 vs:shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPortal>
      <ContextMenuPrimitive.Content
        data-slot='context-menu-content'
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:max-h-(--radix-context-menu-content-available-height) vs:min-w-[8rem] vs:origin-(--radix-context-menu-content-transform-origin) vs:overflow-x-hidden vs:overflow-y-auto vs:rounded-md vs:border vs:p-1 vs:shadow-md',
          className,
        )}
        {...props}
      />
    </ContextMenuPortal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <ContextMenuPrimitive.Item
      data-inset={inset}
      data-variant={variant}
      data-slot='context-menu-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[variant=destructive]:text-destructive vs:data-[variant=destructive]:focus:bg-destructive/10 vs:dark:data-[variant=destructive]:focus:bg-destructive/20 vs:data-[variant=destructive]:focus:text-destructive vs:data-[variant=destructive]:*:[svg]:!text-destructive vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:data-[inset]:pl-8 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      data-slot='context-menu-checkbox-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className='vs:size-4' />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot='context-menu-radio-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className='vs:size-2 vs:fill-current' />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.Label
      data-inset={inset}
      data-slot='context-menu-label'
      className={cn(
        'vs:text-foreground vs:px-2 vs:py-1.5 vs:text-sm vs:font-medium vs:data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn('vs:bg-border vs:-mx-1 vs:my-1 vs:h-px', className)}
      data-slot='context-menu-separator'
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='context-menu-shortcut'
      className={cn(
        'vs:text-muted-foreground vs:ml-auto vs:text-xs vs:tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
}
