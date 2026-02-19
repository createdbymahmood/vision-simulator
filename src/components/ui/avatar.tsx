import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'vs:relative vs:flex vs:size-8 vs:shrink-0 vs:overflow-hidden vs:rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn('vs:aspect-square vs:size-full', className)}
      data-slot='avatar-image'
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'vs:bg-muted vs:flex vs:size-full vs:items-center vs:justify-center vs:rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export {Avatar, AvatarFallback, AvatarImage}
