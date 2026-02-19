import type {VariantProps} from 'class-variance-authority'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as React from 'react'

import {buttonVariants} from '@/components/ui/button'
import {
  resolvePortalContainer,
  usePortalContainer,
} from '@/lib/portal-container'
import {cn} from '@/lib/utils'

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot='alert-dialog' {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot='alert-dialog-trigger' {...props} />
  )
}

function AlertDialogPortal({
  container,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  const portalContainer = usePortalContainer()

  return (
    <AlertDialogPrimitive.Portal
      container={resolvePortalContainer(container, portalContainer)}
      data-slot='alert-dialog-portal'
      {...props}
    />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot='alert-dialog-overlay'
      className={cn(
        'vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:fixed vs:inset-0 vs:z-50 vs:bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot='alert-dialog-content'
        className={cn(
          'vs:bg-background vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:fade-out-0 vs:data-[state=open]:fade-in-0 vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-95 vs:fixed vs:top-[50%] vs:left-[50%] vs:z-50 vs:grid vs:w-full vs:max-w-[calc(100%-2rem)] vs:translate-x-[-50%] vs:translate-y-[-50%] vs:gap-4 vs:rounded-lg vs:border vs:p-4 vs:shadow-lg vs:duration-200 vs:sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-dialog-header'
      className={cn(
        'vs:flex vs:flex-col vs:gap-2 vs:text-center vs:sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-dialog-footer'
      className={cn(
        'vs:flex vs:flex-col-reverse vs:gap-2 vs:sm:flex-row vs:sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('vs:text-lg vs:font-semibold', className)}
      data-slot='alert-dialog-title'
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('vs:text-muted-foreground vs:text-sm', className)}
      data-slot='alert-dialog-description'
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  variant?: VariantProps<typeof buttonVariants>['variant']
}) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({variant}), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({variant: 'outline'}), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
