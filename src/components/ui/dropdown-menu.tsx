import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import {CheckIcon, ChevronRightIcon, CircleIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot='dropdown-menu' {...props} />
}

function DropdownMenuPortal({
  container,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <DropdownMenuPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='dropdown-menu-portal'
      {...props}
    />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot='dropdown-menu-trigger'
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        data-slot='dropdown-menu-content'
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:max-h-(--radix-dropdown-menu-content-available-height) vs:min-w-[8rem] vs:origin-(--radix-dropdown-menu-content-transform-origin) vs:overflow-x-hidden vs:overflow-y-auto vs:rounded-md vs:border vs:p-1 vs:shadow-md',
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot='dropdown-menu-group' {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-inset={inset}
      data-variant={variant}
      data-slot='dropdown-menu-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[variant=destructive]:text-destructive vs:data-[variant=destructive]:focus:bg-destructive/10 vs:dark:data-[variant=destructive]:focus:bg-destructive/20 vs:data-[variant=destructive]:focus:text-destructive vs:data-[variant=destructive]:*:[svg]:!text-destructive vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:data-[inset]:pl-8 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      data-slot='dropdown-menu-checkbox-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className='vs:size-4' />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot='dropdown-menu-radio-group'
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot='dropdown-menu-radio-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:py-1.5 vs:pr-2 vs:pl-8 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='vs:pointer-events-none vs:absolute vs:left-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'>
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className='vs:size-2 vs:fill-current' />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-inset={inset}
      data-slot='dropdown-menu-label'
      className={cn(
        'vs:px-2 vs:py-1.5 vs:text-sm vs:font-medium vs:data-[inset]:pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('vs:bg-border vs:-mx-1 vs:my-1 vs:h-px', className)}
      data-slot='dropdown-menu-separator'
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='dropdown-menu-shortcut'
      className={cn(
        'vs:text-muted-foreground vs:ml-auto vs:text-xs vs:tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot='dropdown-menu-sub' {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-inset={inset}
      data-slot='dropdown-menu-sub-trigger'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:data-[state=open]:bg-accent vs:data-[state=open]:text-accent-foreground vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[inset]:pl-8 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className='vs:ml-auto vs:size-4' />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot='dropdown-menu-sub-content'
      className={cn(
        'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:z-50 vs:min-w-[8rem] vs:origin-(--radix-dropdown-menu-content-transform-origin) vs:overflow-hidden vs:rounded-md vs:border vs:p-1 vs:shadow-lg',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
