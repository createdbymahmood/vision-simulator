'use client'

import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot='separator'
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'vs:bg-border vs:shrink-0 vs:data-[orientation=horizontal]:h-px vs:data-[orientation=horizontal]:w-full vs:data-[orientation=vertical]:h-full vs:data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  )
}

export {Separator}
