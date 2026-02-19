import * as MenubarPrimitive from '@radix-ui/react-menubar'
import {CheckIcon, ChevronRightIcon, CircleIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot='menubar'
      className={cn(
        'vs:bg-background vs:flex vs:h-9 vs:items-center vs:gap-1 vs:rounded-md vs:border vs:p-1 vs:shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot='menubar-menu' {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot='menubar-group' {...props} />
}

function MenubarPortal({
  container,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <MenubarPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='menubar-portal'
      {...props}
    />
  )
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot='menubar-radio-group' {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot='menubar-trigger'
      className={cn(
        'vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[state=open]:bg-accent vs:data-[state=open]:text-accent-foreground vs:flex vs:items-center vs:rounded-sm vs:px-2 vs:py-1 vs:text-sm vs:font-medium vs:outline-hidden vs:select-none',
        className,
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        data-slot='menubar-content'
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:min-w-[12rem] vs:origin-(--radix-menubar-content-transform-origin) vs:overflow-hidden vs:rounded-md vs:border vs:p-1 vs:shadow-md',
          className,
        )}
        {...props}
      />
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <MenubarPrimitive.Item
      data-inset={inset}
      data-variant={variant}
      data-slot='menubar-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[variant=destructive]:text-destructive vs:data-[variant=destructive]:focus:bg-destructive/10 vs:dark:data-[variant=destructive]:focus:bg-destructive/20 vs:data-[variant=destructive]:focus:text-destructive vs:data-[variant=destructive]:*:[svg]:!text-destructive vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:data-[inset]:pl-8 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      data-slot='menubar-checkbox-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-xs vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className='vs:size-4' />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot='menubar-radio-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-xs vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className='vs:size-2 vs:fill-current' />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-inset={inset}
      data-slot='menubar-label'
      className={cn(
        'vs:px-2 vs:py-1.5 vs:text-sm vs:font-medium vs:data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      className={cn('vs:bg-border vs:-mx-1 vs:my-1 vs:h-px', className)}
      data-slot='menubar-separator'
      {...props}
    />
  )
}

function MenubarShortcut({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='menubar-shortcut'
      className={cn(
        'vs:text-muted-foreground vs:ml-auto vs:text-xs vs:tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot='menubar-sub' {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-inset={inset}
      data-slot='menubar-sub-trigger'
      className={cn(
        'vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[state=open]:bg-accent vs:data-[state=open]:text-accent-foreground vs:flex vs:cursor-default vs:items-center vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-none vs:select-none vs:data-[inset]:pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className='vs:ml-auto vs:h-4 vs:w-4' />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot='menubar-sub-content'
      className={cn(
        'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:min-w-[8rem] vs:origin-(--radix-menubar-content-transform-origin) vs:overflow-hidden vs:rounded-md vs:border vs:p-1 vs:shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
}
