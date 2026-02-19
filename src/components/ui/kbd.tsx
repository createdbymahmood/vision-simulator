import {cn} from '@/lib/utils'

function Kbd({className, ...props}: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot='kbd'
      className={cn(
        'vs:bg-muted vs:text-muted-foreground vs:pointer-events-none vs:inline-flex vs:h-5 vs:w-fit vs:min-w-5 vs:items-center vs:justify-center vs:gap-1 vs:rounded-sm vs:px-1 vs:font-sans vs:text-xs vs:font-medium vs:select-none',
        "vs:[&_svg:not([class*='size-'])]:size-3",
        'vs:[[data-slot=tooltip-content]_&]:bg-background/20 vs:[[data-slot=tooltip-content]_&]:text-background vs:dark:[[data-slot=tooltip-content]_&]:bg-background/10',
        className,
      )}
      {...props}
    />
  )
}

function KbdGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <kbd
      className={cn('vs:inline-flex vs:items-center vs:gap-1', className)}
      data-slot='kbd-group'
      {...props}
    />
  )
}

export {Kbd, KbdGroup}
