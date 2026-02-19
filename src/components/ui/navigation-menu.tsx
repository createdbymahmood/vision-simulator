import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import {cva} from 'class-variance-authority'
import {ChevronDownIcon} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot='navigation-menu'
      data-viewport={viewport}
      className={cn(
        'vs:group/navigation-menu vs:relative vs:flex vs:max-w-max vs:flex-1 vs:items-center vs:justify-center',
        className,
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot='navigation-menu-list'
      className={cn(
        'vs:group vs:flex vs:flex-1 vs:list-none vs:items-center vs:justify-center vs:gap-1',
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      className={cn('vs:relative', className)}
      data-slot='navigation-menu-item'
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  'vs:group vs:inline-flex vs:h-9 vs:w-max vs:items-center vs:justify-center vs:rounded-md vs:bg-background vs:px-4 vs:py-2 vs:text-sm vs:font-medium vs:hover:bg-accent vs:hover:text-accent-foreground vs:focus:bg-accent vs:focus:text-accent-foreground vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:data-[state=open]:hover:bg-accent vs:data-[state=open]:text-accent-foreground vs:data-[state=open]:focus:bg-accent vs:data-[state=open]:bg-accent/50 vs:focus-visible:ring-ring/50 vs:outline-none vs:transition-[color,box-shadow] vs:focus-visible:ring-[3px] vs:focus-visible:outline-1',
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(navigationMenuTriggerStyle(), 'vs:group', className)}
      data-slot='navigation-menu-trigger'
      {...props}
    >
      {children}{' '}
      <ChevronDownIcon
        aria-hidden='true'
        className='vs:relative vs:top-[1px] vs:ml-1 vs:size-3 vs:transition vs:duration-300 vs:group-data-[state=open]:rotate-180'
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot='navigation-menu-content'
      className={cn(
        'vs:data-[motion^=from-]:animate-in vs:data-[motion^=to-]:animate-out vs:data-[motion^=from-]:fade-in vs:data-[motion^=to-]:fade-out vs:data-[motion=from-end]:slide-in-from-right-52 vs:data-[motion=from-start]:slide-in-from-left-52 vs:data-[motion=to-end]:slide-out-to-right-52 vs:data-[motion=to-start]:slide-out-to-left-52 vs:top-0 vs:left-0 vs:w-full vs:p-2 vs:pr-2.5 vs:md:absolute vs:md:w-auto',
        'vs:group-data-[viewport=false]/navigation-menu:bg-popover vs:group-data-[viewport=false]/navigation-menu:text-popover-foreground vs:group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in vs:group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out vs:group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 vs:group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 vs:group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 vs:group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 vs:group-data-[viewport=false]/navigation-menu:top-full vs:group-data-[viewport=false]/navigation-menu:mt-1.5 vs:group-data-[viewport=false]/navigation-menu:overflow-hidden vs:group-data-[viewport=false]/navigation-menu:rounded-md vs:group-data-[viewport=false]/navigation-menu:border vs:group-data-[viewport=false]/navigation-menu:shadow vs:group-data-[viewport=false]/navigation-menu:duration-200 vs:**:data-[slot=navigation-menu-link]:focus:ring-0 vs:**:data-[slot=navigation-menu-link]:focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        'vs:absolute vs:top-full vs:left-0 vs:isolate vs:z-50 vs:flex vs:justify-center',
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot='navigation-menu-viewport'
        className={cn(
          'vs:origin-top-center vs:bg-popover vs:text-popover-foreground vs:data-[state=open]:animate-in vs:data-[state=closed]:animate-out vs:data-[state=closed]:zoom-out-95 vs:data-[state=open]:zoom-in-90 vs:relative vs:mt-1.5 vs:h-[var(--radix-navigation-menu-viewport-height)] vs:w-full vs:overflow-hidden vs:rounded-md vs:border vs:shadow vs:md:w-[var(--radix-navigation-menu-viewport-width)]',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot='navigation-menu-link'
      className={cn(
        "vs:data-[active=true]:focus:bg-accent vs:data-[active=true]:hover:bg-accent vs:data-[active=true]:bg-accent/50 vs:data-[active=true]:text-accent-foreground vs:hover:bg-accent vs:hover:text-accent-foreground vs:focus:bg-accent vs:focus:text-accent-foreground vs:focus-visible:ring-ring/50 vs:[&_svg:not([class*='vs:text-'])]:text-muted-foreground vs:flex vs:flex-col vs:gap-1 vs:rounded-sm vs:p-2 vs:text-sm vs:transition-all vs:outline-none vs:focus-visible:ring-[3px] vs:focus-visible:outline-1 vs:[&_svg:not([class*='vs:size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot='navigation-menu-indicator'
      className={cn(
        'vs:data-[state=visible]:animate-in vs:data-[state=hidden]:animate-out vs:data-[state=hidden]:fade-out vs:data-[state=visible]:fade-in vs:top-full vs:z-[1] vs:flex vs:h-1.5 vs:items-end vs:justify-center vs:overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className='vs:bg-border vs:relative vs:top-[60%] vs:h-2 vs:w-2 vs:rotate-45 vs:rounded-tl-sm vs:shadow-md' />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
}
