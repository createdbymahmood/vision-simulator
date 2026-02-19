import {Command as CommandPrimitive} from 'cmdk'
import {SearchIcon} from 'lucide-react'
import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {cn} from '@/lib/utils'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot='command'
      className={cn(
        'vs:bg-popover vs:text-popover-foreground vs:flex vs:h-full vs:w-full vs:flex-col vs:overflow-hidden vs:rounded-md',
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className='vs:sr-only'>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn('vs:overflow-hidden vs:p-0', className)}
        showCloseButton={showCloseButton}
      >
        <Command className='vs:[&_[cmdk-group-heading]]:text-muted-foreground vs:**:data-[slot=command-input-wrapper]:h-12 vs:[&_[cmdk-group-heading]]:px-2 vs:[&_[cmdk-group-heading]]:font-medium vs:[&_[cmdk-group]]:px-2 vs:[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 vs:[&_[cmdk-input-wrapper]_svg]:h-5 vs:[&_[cmdk-input-wrapper]_svg]:w-5 vs:[&_[cmdk-input]]:h-12 vs:[&_[cmdk-item]]:px-2 vs:[&_[cmdk-item]]:py-3 vs:[&_[cmdk-item]_svg]:h-5 vs:[&_[cmdk-item]_svg]:w-5'>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      className='vs:flex vs:h-9 vs:items-center vs:gap-2 vs:border-b vs:px-3'
      data-slot='command-input-wrapper'
    >
      <SearchIcon className='vs:size-4 vs:shrink-0 vs:opacity-50' />
      <CommandPrimitive.Input
        data-slot='command-input'
        className={cn(
          'vs:placeholder:text-muted-foreground vs:flex vs:h-10 vs:w-full vs:rounded-md vs:bg-transparent vs:py-3 vs:text-sm vs:outline-hidden vs:disabled:cursor-not-allowed vs:disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  onWheelCapture,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const handleWheelCapture = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.stopPropagation()
      onWheelCapture?.(event)
    },
    [onWheelCapture],
  )

  return (
    <CommandPrimitive.List
      data-slot='command-list'
      onWheelCapture={handleWheelCapture}
      className={cn(
        'vs:max-h-[300px] vs:scroll-py-1 vs:overflow-x-hidden vs:overflow-y-auto',
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      className='vs:py-6 vs:text-center vs:text-sm'
      data-slot='command-empty'
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot='command-group'
      className={cn(
        'vs:text-foreground vs:[&_[cmdk-group-heading]]:text-muted-foreground vs:overflow-hidden vs:p-1 vs:[&_[cmdk-group-heading]]:px-2 vs:[&_[cmdk-group-heading]]:py-1.5 vs:[&_[cmdk-group-heading]]:text-xs vs:[&_[cmdk-group-heading]]:font-medium',
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn('vs:bg-border vs:-mx-1 vs:h-px', className)}
      data-slot='command-separator'
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot='command-item'
      className={cn(
        "vs:data-[selected=true]:bg-accent vs:data-[selected=true]:text-accent-foreground vs:[&_svg:not([class*='text-'])]:text-muted-foreground vs:relative vs:flex vs:cursor-default vs:items-center vs:gap-2 vs:rounded-sm vs:px-2 vs:py-1.5 vs:text-sm vs:outline-hidden vs:select-none vs:data-[disabled=true]:pointer-events-none vs:data-[disabled=true]:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function CommandShortcut({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='command-shortcut'
      className={cn(
        'vs:text-muted-foreground vs:ml-auto vs:text-xs vs:tracking-widest',
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}
