import * as DialogPrimitive from '@radix-ui/react-dialog'
import {XIcon} from 'lucide-react'
import * as React from 'react'

import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function Dialog({...props}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />
}

function DialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <DialogPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='dialog-portal'
      {...props}
    />
  )
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:fixed vs:inset-0 vs:z-50 vs:bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        className={cn(
          'vs:bg-background vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:fixed vs:top-[50%] vs:left-[50%] vs:z-50 vs:grid vs:w-full vs:max-w-[calc(100%-2rem)] vs:translate-x-[-50%] vs:translate-y-[-50%] vs:gap-4 vs:rounded-lg vs:border vs:p-6 vs:shadow-lg vs:duration-200 vs:outline-none vs:sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className="vs:ring-offset-background vs:focus:ring-ring vs:data-[state=open]:bg-accent vs:data-[state=open]:text-muted-foreground vs:absolute vs:top-4 vs:right-4 vs:rounded-xs vs:opacity-70 vs:transition-opacity vs:hover:opacity-100 vs:focus:ring-2 vs:focus:ring-offset-2 vs:focus:outline-hidden vs:disabled:pointer-events-none vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='size-'])]:size-4"
            data-slot='dialog-close'
          >
            <XIcon />
            <span className='vs:sr-only'>Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn(
        'vs:flex vs:flex-col vs:gap-2 vs:text-center vs:sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

function DialogFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'vs:flex vs:flex-col-reverse vs:gap-2 vs:sm:flex-row vs:sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('vs:text-lg vs:leading-none vs:font-semibold', className)}
      data-slot='dialog-title'
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('vs:text-muted-foreground vs:text-sm', className)}
      data-slot='dialog-description'
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
