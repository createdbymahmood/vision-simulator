import type {VariantProps} from 'class-variance-authority'

import {Slot} from '@radix-ui/react-slot'
import {cva} from 'class-variance-authority'

import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'

const buttonGroupVariants = cva(
  "vs:flex vs:w-fit vs:items-stretch vs:[&>*]:focus-visible:z-10 vs:[&>*]:focus-visible:relative vs:[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit vs:[&>input]:flex-1 vs:has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md vs:has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal:
          'vs:[&>*:not(:first-child)]:rounded-l-none vs:[&>*:not(:first-child)]:border-l-0 vs:[&>*:not(:last-child)]:rounded-r-none',
        vertical:
          'vs:flex-col vs:[&>*:not(:first-child)]:rounded-t-none vs:[&>*:not(:first-child)]:border-t-0 vs:[&>*:not(:last-child)]:rounded-b-none',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      className={cn(buttonGroupVariants({orientation}), className)}
      data-orientation={orientation}
      data-slot='button-group'
      role='group'
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      className={cn(
        "vs:bg-muted vs:flex vs:items-center vs:gap-2 vs:rounded-md vs:border vs:px-4 vs:text-sm vs:font-medium vs:shadow-xs vs:[&_svg]:pointer-events-none vs:[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot='button-group-separator'
      orientation={orientation}
      className={cn(
        'vs:bg-input vs:relative vs:!m-0 vs:self-stretch vs:data-[orientation=vertical]:h-auto',
        className,
      )}
      {...props}
    />
  )
}

export {ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants}
