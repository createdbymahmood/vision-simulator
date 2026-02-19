import * as React from 'react'

import {cn} from '@/lib/utils'

function Textarea({className, ...props}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'vs:border-input vs:placeholder:text-muted-foreground vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:dark:bg-input/30 vs:flex vs:field-sizing-content vs:min-h-16 vs:w-full vs:rounded-md vs:border vs:bg-transparent vs:px-3 vs:py-2 vs:text-base vs:shadow-xs vs:transition-[color,box-shadow] vs:outline-none vs:focus-visible:ring-[3px] vs:disabled:cursor-not-allowed vs:disabled:opacity-50 vs:md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export {Textarea}
