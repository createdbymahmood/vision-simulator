'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(
        'vs:peer vs:data-[state=checked]:bg-primary vs:data-[state=unchecked]:bg-input vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:dark:data-[state=unchecked]:bg-input/80 vs:inline-flex vs:h-5 vs:w-9 vs:shrink-0 vs:items-center vs:rounded-full vs:border vs:border-transparent vs:shadow-xs vs:transition-all vs:outline-none vs:focus-visible:ring-[3px] vs:disabled:cursor-not-allowed vs:disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(
          'vs:bg-background vs:dark:data-[state=unchecked]:bg-accent vs:dark:data-[state=checked]:bg-primary-foreground vs:pointer-events-none vs:block vs:size-4 vs:rounded-full vs:ring-0 vs:transition-transform vs:data-[state=checked]:translate-x-[calc(100%)] vs:data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export {Switch}
