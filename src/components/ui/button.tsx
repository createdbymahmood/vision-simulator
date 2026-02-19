import type {VariantProps} from 'class-variance-authority'

import {Slot} from '@radix-ui/react-slot'
import {cva} from 'class-variance-authority'
import * as React from 'react'

import {cn} from '@/lib/utils'

const buttonVariants = cva(
  "vs:cursor-pointer vs:inline-flex vs:items-center vs:justify-center vs:gap-2 vs:whitespace-nowrap vs:rounded-md vs:text-sm vs:font-medium vs:transition-all vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:[&_svg]:pointer-events-none vs:[&_svg:not([class*='vs:size-'])]:size-4 vs:shrink-0 vs:[&_svg]:shrink-0 vs:outline-none vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:ring-[3px] vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'vs:bg-primary vs:text-primary-foreground vs:hover:bg-primary/90',
        destructive:
          'vs:bg-destructive vs:text-white vs:hover:bg-destructive/90 vs:focus-visible:ring-destructive/20 vs:dark:focus-visible:ring-destructive/40 vs:dark:bg-destructive/60',
        outline:
          'vs:border vs:bg-background vs:shadow-xs vs:hover:bg-accent vs:hover:text-accent-foreground vs:dark:bg-input/30 vs:dark:border-input vs:dark:hover:bg-input/50',
        secondary:
          'vs:bg-secondary vs:text-secondary-foreground vs:hover:bg-secondary/80',
        ghost:
          'vs:hover:bg-accent vs:hover:text-accent-foreground vs:dark:hover:bg-accent/50',
        link: 'vs:text-primary vs:underline-offset-4',
      },
      size: {
        default:
          'vs:h-10 vs:px-4 vs:py-2 vs:has-[>svg]:px-3 vs:font-semibold vs:rounded-lg',
        sm: 'vs:h-8 vs:rounded-md vs:gap-1.5 vs:px-3 vs:has-[>svg]:px-2.5',
        lg: 'vs:h-11 vs:rounded-md vs:px-6 vs:has-[>svg]:px-4',
        icon: 'vs:size-10 vs:flex vs:items-center vs:justify-center',
        'icon-sm': 'vs:size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-size={size}
      aria-busy={loading || undefined}
      data-variant={variant}
      disabled={disabled || loading}
      data-slot='button'
      className={cn(
        buttonVariants({variant, size, className}),
        loading && 'vs:relative',
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden='true'
          className='vs:absolute vs:inset-0 vs:flex vs:items-center vs:justify-center'
        >
          <span className='vs:inline-flex vs:size-4 vs:animate-spin vs:rounded-full vs:border-2 vs:border-current vs:border-t-transparent vs:shrink-0' />
        </span>
      ) : null}
      <span
        className={cn(
          'vs:inline-flex vs:items-center vs:gap-2 vs:shrink-0',
          loading && 'vs:invisible',
        )}
      >
        {children}
      </span>
    </Comp>
  )
}

export {Button, buttonVariants}
