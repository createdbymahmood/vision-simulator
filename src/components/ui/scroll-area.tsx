'use client'

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import * as React from 'react'

import {cn} from '@/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('vs:relative', className)}
      data-slot='scroll-area'
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className='vs:focus-visible:ring-ring/50 vs:size-full vs:rounded-[inherit] vs:transition-[color,box-shadow] vs:outline-none vs:focus-visible:ring-[3px] vs:focus-visible:outline-1'
        data-slot='scroll-area-viewport'
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      className={cn(
        'vs:flex vs:touch-none vs:p-px vs:transition-colors vs:select-none',
        orientation === 'vertical' &&
          'vs:h-full vs:w-2.5 vs:border-l vs:border-l-transparent',
        orientation === 'horizontal' &&
          'vs:h-2.5 vs:flex-col vs:border-t vs:border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className='vs:bg-border vs:relative vs:flex-1 vs:rounded-full'
        data-slot='scroll-area-thumb'
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export {ScrollArea, ScrollBar}
