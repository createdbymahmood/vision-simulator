import * as SelectPrimitive from '@radix-ui/react-select'
import {CheckIcon, ChevronDownIcon, ChevronUpIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Select({...props}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot='select' {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot='select-value' {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'default' | 'sm'
}) {
  return (
    <SelectPrimitive.Trigger
      data-size={size}
      data-slot='select-trigger'
      className={cn(
        "vs:border-input vs:data-[placeholder]:text-muted-foreground vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:dark:bg-input/30 vs:dark:hover:bg-input/50 vs:flex vs:w-fit vs:items-center vs:justify-between vs:gap-2 vs:rounded-md vs:border vs:bg-transparent vs:px-3 vs:py-2 vs:text-sm vs:whitespace-nowrap vs:shadow-xs vs:transition-[color,box-shadow] vs:outline-none vs:focus-visible:ring-[3px] vs:disabled:cursor-not-allowed vs:disabled:opacity-50 vs:data-[size=default]:h-9 vs:data-[size=sm]:h-8 vs:*:data-[slot=select-value]:line-clamp-1 vs:*:data-[slot=select-value]:flex vs:*:data-[slot=select-value]:items-center vs:*:data-[slot=select-value]:gap-2 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className='vs:size-4 vs:opacity-50' />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = 'item-aligned',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const portalContainer = usePortalContainer()

  return (
    <SelectPrimitive.Portal
      container={resolvePortalContainer(undefined, portalContainer)}
    >
      <SelectPrimitive.Content
        align={align}
        data-slot='select-content'
        position={position}
        className={cn(
          'vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:data-[side=bottom]:slide-in-from-top-2 vs:data-[side=left]:slide-in-from-right-2 vs:data-[side=right]:slide-in-from-left-2 vs:data-[side=top]:slide-in-from-bottom-2 vs:relative vs:z-50 vs:max-h-(--radix-select-content-available-height) vs:min-w-[8rem] vs:origin-(--radix-select-content-transform-origin) vs:overflow-x-hidden vs:overflow-y-auto vs:rounded-md vs:border vs:shadow-md',
          position === 'popper' &&
            'vs:data-[side=bottom]:translate-y-1 vs:data-[side=left]:-translate-x-1 vs:data-[side=right]:translate-x-1 vs:data-[side=top]:-translate-y-1',
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'vs:p-1',
            position === 'popper' &&
              'vs:h-[var(--radix-select-trigger-height)] vs:w-full vs:min-w-[var(--radix-select-trigger-width)] vs:scroll-my-1',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot='select-label'
      className={cn(
        'vs:text-muted-foreground vs:px-2 vs:py-1.5 vs:text-xs',
        className,
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot='select-item'
      className={cn(
        "vs:focus:bg-accent vs:focus:text-accent-foreground vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:relative vs:flex vs:w-full vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:py-1.5 vs:pr-8 vs:pl-2 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled]:pointer-events-none vs:data-[disabled]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='vs:size-'])]:size-4 vs:*:[span]:last:flex vs:*:[span]:last:items-center vs:*:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        className='vs:absolute vs:right-2 vs:flex vs:size-3.5 vs:items-center vs:justify-center'
        data-slot='select-item-indicator'
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className='vs:size-4' />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot='select-separator'
      className={cn(
        'vs:bg-border vs:pointer-events-none vs:-mx-1 vs:my-1 vs:h-px',
        className,
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot='select-scroll-up-button'
      className={cn(
        'vs:flex vs:cursor-default vs:items-center vs:justify-center vs:py-1',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className='vs:size-4' />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot='select-scroll-down-button'
      className={cn(
        'vs:flex vs:cursor-default vs:items-center vs:justify-center vs:py-1',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className='vs:size-4' />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
