import * as React from 'react'

import {cn} from '@/lib/utils'

function Input({className, type, ...props}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'vs:file:text-foreground vs:placeholder:text-muted-foreground vs:selection:bg-primary vs:selection:text-primary-foreground vs:dark:bg-input/30 vs:border-input vs:h-9 vs:w-full vs:min-w-0 vs:rounded-md vs:border vs:bg-transparent vs:px-3 vs:py-1 vs:text-base vs:shadow-xs vs:transition-[color,box-shadow] vs:outline-none vs:file:inline-flex vs:file:h-7 vs:file:border-0 vs:file:bg-transparent vs:file:text-sm vs:file:font-medium vs:disabled:pointer-events-none vs:disabled:cursor-not-allowed vs:disabled:opacity-50 vs:md:text-sm',
        'vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:ring-[3px]',
        'vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export {Input}
