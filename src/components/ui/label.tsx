'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot='label'
      className={cn(
        'vs:flex vs:items-center vs:gap-2 vs:text-sm vs:leading-none vs:font-medium vs:select-none vs:group-data-[disabled=true]:pointer-events-none vs:group-data-[disabled=true]:opacity-50 vs:peer-disabled:cursor-not-allowed vs:peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export {Label}
