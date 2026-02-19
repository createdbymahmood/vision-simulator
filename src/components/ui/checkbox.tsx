'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import {CheckIcon} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'vs:peer vs:border-input vs:dark:bg-input/30 vs:data-[state=checked]:bg-primary vs:data-[state=checked]:text-primary-foreground vs:dark:data-[state=checked]:bg-primary vs:data-[state=checked]:border-primary vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:size-4 vs:shrink-0 vs:rounded-[4px] vs:border vs:shadow-xs vs:transition-shadow vs:outline-none vs:focus-visible:ring-[3px] vs:disabled:cursor-not-allowed vs:disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className='vs:grid vs:place-content-center vs:text-current vs:transition-none'
        data-slot='checkbox-indicator'
      >
        <CheckIcon className='vs:size-3.5' />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export {Checkbox}
