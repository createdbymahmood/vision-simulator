import * as SheetPrimitive from '@radix-ui/react-dialog'
import {XIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Sheet({...props}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot='sheet' {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot='sheet-trigger' {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot='sheet-close' {...props} />
}

function SheetPortal({
  container,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <SheetPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='sheet-portal'
      {...props}
    />
  )
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot='sheet-overlay'
      className={cn(
        'vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:fixed vs:inset-0 vs:z-50 vs:bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'bottom' | 'left' | 'right' | 'top'
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot='sheet-content'
        className={cn(
          'vs:bg-background vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:fixed vs:z-50 vs:flex vs:flex-col vs:gap-4 vs:shadow-lg vs:transition vs:ease-in-out vs:data-[state=closed]:duration-300 vs:data-[state=open]:duration-500 vs:px-4',
          side === 'right' &&
            'vs:data-[state=closed]:slide-out-to-right vs:data-[state=open]:slide-in-from-right vs:inset-y-0 vs:right-0 vs:h-full vs:w-3/4 vs:border-l vs:sm:max-w-sm',
          side === 'left' &&
            'vs:data-[state=closed]:slide-out-to-left vs:data-[state=open]:slide-in-from-left vs:inset-y-0 vs:left-0 vs:h-full vs:w-3/4 vs:border-r vs:sm:max-w-sm',
          side === 'top' &&
            'vs:data-[state=closed]:slide-out-to-top vs:data-[state=open]:slide-in-from-top vs:inset-x-0 vs:top-0 vs:h-auto vs:border-b',
          side === 'bottom' &&
            'vs:data-[state=closed]:slide-out-to-bottom vs:data-[state=open]:slide-in-from-bottom vs:inset-x-0 vs:bottom-0 vs:h-auto vs:border-t',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className='vs:ring-offset-background vs:focus:ring-ring vs:data-[state=open]:bg-secondary vs:absolute vs:top-4 vs:right-4 vs:rounded-xs vs:opacity-70 vs:transition-opacity vs:hover:opacity-100 vs:focus:ring-2 vs:focus:ring-offset-2 vs:focus:outline-hidden vs:disabled:pointer-events-none'>
          <XIcon className='vs:size-4' />
          <span className='vs:sr-only'>Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:flex vs:flex-col vs:gap-1.5 vs:py-4', className)}
      data-slot='sheet-header'
      {...props}
    />
  )
}

function SheetFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sheet-footer'
      className={cn(
        'vs:mt-auto vs:flex vs:flex-col vs:gap-2 vs:p-4',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn('vs:text-foreground vs:font-semibold', className)}
      data-slot='sheet-title'
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('vs:text-muted-foreground vs:text-sm', className)}
      data-slot='sheet-description'
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
