/* eslint-disable @eslint-react/no-unstable-context-value */

import type {VariantProps} from 'class-variance-authority'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import * as React from 'react'

import {toggleVariants} from '@/components/ui/toggle'
import {cn} from '@/lib/utils'

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }
>({
  size: 'default',
  variant: 'default',
  spacing: 0,
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-size={size}
      data-spacing={spacing}
      data-variant={variant}
      style={{'--gap': spacing} as React.CSSProperties}
      data-slot='toggle-group'
      className={cn(
        'vs:group/toggle-group vs:flex vs:w-fit vs:items-center vs:gap-[--spacing(var(--gap))] vs:rounded-md vs:data-[spacing=default]:data-[variant=outline]:shadow-xs',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{variant, size, spacing}}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-size={context.size || size}
      data-spacing={context.spacing}
      data-variant={context.variant || variant}
      data-slot='toggle-group-item'
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        'vs:w-auto vs:min-w-0 vs:shrink-0 vs:px-3 vs:focus:z-10 vs:focus-visible:z-10',
        'vs:data-[spacing=0]:rounded-none vs:data-[spacing=0]:shadow-none vs:data-[spacing=0]:first:rounded-l-md vs:data-[spacing=0]:last:rounded-r-md vs:data-[spacing=0]:data-[variant=outline]:border-l-0 vs:data-[spacing=0]:data-[variant=outline]:first:border-l',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export {ToggleGroup, ToggleGroupItem}
