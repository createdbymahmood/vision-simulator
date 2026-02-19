'use client'

/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/no-shadow */

import type {VariantProps} from 'class-variance-authority'

import {Slot} from '@radix-ui/react-slot'
import {cva} from 'class-variance-authority'
import {PanelLeftIcon} from 'lucide-react'
import * as React from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Separator} from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {Skeleton} from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {useIsMobile} from '@/hooks/use-mobile'
import {cn} from '@/lib/utils'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

interface SidebarContextProps {
  state: 'collapsed' | 'expanded'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: ((value: boolean) => boolean) | boolean) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open],
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot='sidebar-wrapper'
          className={cn(
            'vs:group/sidebar-wrapper vs:has-data-[variant=inset]:bg-sidebar vs:flex vs:min-h-svh vs:w-full',
            className,
          )}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'floating' | 'inset' | 'sidebar'
  collapsible?: 'icon' | 'none' | 'offcanvas'
}) {
  const {isMobile, state, openMobile, setOpenMobile} = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot='sidebar'
        className={cn(
          'vs:bg-sidebar vs:text-sidebar-foreground vs:flex vs:h-full vs:w-(--sidebar-width) vs:flex-col',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet onOpenChange={setOpenMobile} open={openMobile} {...props}>
        <SheetContent
          className='vs:bg-sidebar vs:text-sidebar-foreground vs:w-(--sidebar-width) vs:p-0 vs:[&>button]:hidden'
          data-sidebar='sidebar'
          side={side}
          data-mobile='true'
          data-slot='sidebar'
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <SheetHeader className='vs:sr-only'>
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className='vs:flex vs:h-full vs:w-full vs:flex-col'>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className='vs:group vs:peer vs:text-sidebar-foreground vs:hidden vs:md:block'
      data-side={side}
      data-state={state}
      data-variant={variant}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-slot='sidebar'
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot='sidebar-gap'
        className={cn(
          'vs:relative vs:w-(--sidebar-width) vs:bg-transparent vs:transition-[width] vs:duration-200 vs:ease-linear',
          'vs:group-data-[collapsible=offcanvas]:w-0',
          'vs:group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'vs:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'vs:group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot='sidebar-container'
        className={cn(
          'vs:fixed vs:inset-y-0 vs:z-10 vs:hidden vs:h-svh vs:w-(--sidebar-width) vs:transition-[left,right,width] vs:duration-200 vs:ease-linear vs:md:flex',
          side === 'left'
            ? 'vs:left-0 vs:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'vs:right-0 vs:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'vs:p-2 vs:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'vs:group-data-[collapsible=icon]:w-(--sidebar-width-icon) vs:group-data-[side=left]:border-r vs:group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          className='vs:bg-sidebar vs:group-data-[variant=floating]:border-sidebar-border vs:flex vs:h-full vs:w-full vs:flex-col vs:group-data-[variant=floating]:rounded-lg vs:group-data-[variant=floating]:border vs:group-data-[variant=floating]:shadow-sm'
          data-sidebar='sidebar'
          data-slot='sidebar-inner'
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const {toggleSidebar} = useSidebar()
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      toggleSidebar()
    },
    [onClick, toggleSidebar],
  )

  return (
    <Button
      size='icon'
      className={cn('vs:size-7', className)}
      data-sidebar='trigger'
      variant='ghost'
      data-slot='sidebar-trigger'
      onClick={handleClick}
      {...props}
    >
      <PanelLeftIcon />
      <span className='vs:sr-only'>Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({className, ...props}: React.ComponentProps<'button'>) {
  const {toggleSidebar} = useSidebar()

  return (
    <button
      aria-label='Toggle Sidebar'
      data-sidebar='rail'
      tabIndex={-1}
      title='Toggle Sidebar'
      type='button'
      data-slot='sidebar-rail'
      onClick={toggleSidebar}
      className={cn(
        'vs:hover:after:bg-sidebar-border vs:absolute vs:inset-y-0 vs:z-20 vs:hidden vs:w-4 vs:-translate-x-1/2 vs:transition-all vs:ease-linear vs:group-data-[side=left]:-right-4 vs:group-data-[side=right]:left-0 vs:after:absolute vs:after:inset-y-0 vs:after:left-1/2 vs:after:w-[2px] vs:sm:flex',
        'vs:in-data-[side=left]:cursor-w-resize vs:in-data-[side=right]:cursor-e-resize',
        'vs:[[data-side=left][data-state=collapsed]_&]:cursor-e-resize vs:[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'vs:hover:group-data-[collapsible=offcanvas]:bg-sidebar vs:group-data-[collapsible=offcanvas]:translate-x-0 vs:group-data-[collapsible=offcanvas]:after:left-full',
        'vs:[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        'vs:[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInset({className, ...props}: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot='sidebar-inset'
      className={cn(
        'vs:bg-background vs:relative vs:flex vs:w-full vs:flex-1 vs:flex-col',
        'vs:md:peer-data-[variant=inset]:m-2 vs:md:peer-data-[variant=inset]:ml-0 vs:md:peer-data-[variant=inset]:rounded-xl vs:md:peer-data-[variant=inset]:shadow-sm vs:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-sidebar='input'
      data-slot='sidebar-input'
      className={cn(
        'vs:bg-background vs:h-8 vs:w-full vs:shadow-none',
        className,
      )}
      {...props}
    />
  )
}

function SidebarHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:flex vs:flex-col vs:gap-2 vs:p-2', className)}
      data-sidebar='header'
      data-slot='sidebar-header'
      {...props}
    />
  )
}

function SidebarFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:flex vs:flex-col vs:gap-2 vs:p-2', className)}
      data-sidebar='footer'
      data-slot='sidebar-footer'
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn('vs:bg-sidebar-border vs:mx-2 vs:w-auto', className)}
      data-sidebar='separator'
      data-slot='sidebar-separator'
      {...props}
    />
  )
}

function SidebarContent({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-sidebar='content'
      data-slot='sidebar-content'
      className={cn(
        'vs:flex vs:min-h-0 vs:flex-1 vs:flex-col vs:gap-2 vs:overflow-auto vs:group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-sidebar='group'
      data-slot='sidebar-group'
      className={cn(
        'vs:relative vs:flex vs:w-full vs:min-w-0 vs:flex-col vs:p-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      data-sidebar='group-label'
      data-slot='sidebar-group-label'
      className={cn(
        'vs:text-sidebar-foreground/70 vs:ring-sidebar-ring vs:flex vs:h-8 vs:shrink-0 vs:items-center vs:rounded-md vs:px-2 vs:text-xs vs:font-medium vs:outline-hidden vs:transition-[margin,opacity] vs:duration-200 vs:ease-linear vs:focus-visible:ring-2 vs:[&>svg]:size-4 vs:[&>svg]:shrink-0',
        'vs:group-data-[collapsible=icon]:-mt-8 vs:group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-sidebar='group-action'
      data-slot='sidebar-group-action'
      className={cn(
        'vs:text-sidebar-foreground vs:ring-sidebar-ring vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground vs:absolute vs:top-3.5 vs:right-3 vs:flex vs:aspect-square vs:w-5 vs:items-center vs:justify-center vs:rounded-md vs:p-0 vs:outline-hidden vs:transition-transform vs:focus-visible:ring-2 vs:[&>svg]:size-4 vs:[&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'vs:after:absolute vs:after:-inset-2 vs:md:after:hidden',
        'vs:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:w-full vs:text-sm', className)}
      data-sidebar='group-content'
      data-slot='sidebar-group-content'
      {...props}
    />
  )
}

function SidebarMenu({className, ...props}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-sidebar='menu'
      data-slot='sidebar-menu'
      className={cn(
        'vs:flex vs:w-full vs:min-w-0 vs:flex-col vs:gap-1',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuItem({className, ...props}: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('vs:group/menu-item vs:relative', className)}
      data-sidebar='menu-item'
      data-slot='sidebar-menu-item'
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  'vs:peer/menu-button vs:flex vs:w-full vs:items-center vs:gap-2 vs:overflow-hidden vs:rounded-md vs:p-2 vs:text-left vs:text-sm vs:outline-hidden vs:ring-sidebar-ring vs:transition-[width,height,padding] vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground vs:focus-visible:ring-2 vs:active:bg-sidebar-accent vs:active:text-sidebar-accent-foreground vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:group-has-data-[sidebar=menu-action]/menu-item:pr-8 vs:aria-disabled:pointer-events-none vs:aria-disabled:opacity-50 vs:data-[active=true]:bg-sidebar-accent vs:data-[active=true]:font-medium vs:data-[active=true]:text-sidebar-accent-foreground vs:data-[state=open]:hover:bg-sidebar-accent vs:data-[state=open]:hover:text-sidebar-accent-foreground vs:group-data-[collapsible=icon]:size-8! vs:group-data-[collapsible=icon]:p-2! vs:[&>span:last-child]:truncate vs:[&>svg]:size-4 vs:[&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground',
        outline:
          'vs:bg-background vs:shadow-[0_0_0_1px_hsl(var(--sidebar-border))] vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground vs:hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'vs:h-8 vs:text-sm',
        sm: 'vs:h-7 vs:text-xs',
        lg: 'vs:h-12 vs:text-sm vs:group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }) {
  const Comp = asChild ? Slot : 'button'
  const {isMobile, state} = useSidebar()

  const button = (
    <Comp
      data-size={size}
      className={cn(sidebarMenuButtonVariants({variant, size}), className)}
      data-active={isActive}
      data-sidebar='menu-button'
      data-slot='sidebar-menu-button'
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  const tooltipContent =
    typeof tooltip === 'string' ? {children: tooltip} : tooltip

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        align='center'
        hidden={state !== 'collapsed' || isMobile}
        side='right'
        {...tooltipContent}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-sidebar='menu-action'
      data-slot='sidebar-menu-action'
      className={cn(
        'vs:text-sidebar-foreground vs:ring-sidebar-ring vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground vs:peer-hover/menu-button:text-sidebar-accent-foreground vs:absolute vs:top-1.5 vs:right-1 vs:flex vs:aspect-square vs:w-5 vs:items-center vs:justify-center vs:rounded-md vs:p-0 vs:outline-hidden vs:transition-transform vs:focus-visible:ring-2 vs:[&>svg]:size-4 vs:[&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'vs:after:absolute vs:after:-inset-2 vs:md:after:hidden',
        'vs:peer-data-[size=sm]/menu-button:top-1',
        'vs:peer-data-[size=default]/menu-button:top-1.5',
        'vs:peer-data-[size=lg]/menu-button:top-2.5',
        'vs:group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'vs:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground vs:group-focus-within/menu-item:opacity-100 vs:group-hover/menu-item:opacity-100 vs:data-[state=open]:opacity-100 vs:md:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-sidebar='menu-badge'
      data-slot='sidebar-menu-badge'
      className={cn(
        'vs:text-sidebar-foreground vs:pointer-events-none vs:absolute vs:right-1 vs:flex vs:h-5 vs:min-w-5 vs:items-center vs:justify-center vs:rounded-md vs:px-1 vs:text-xs vs:font-medium vs:tabular-nums vs:select-none',
        'vs:peer-hover/menu-button:text-sidebar-accent-foreground vs:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        'vs:peer-data-[size=sm]/menu-button:top-1',
        'vs:peer-data-[size=default]/menu-button:top-1.5',
        'vs:peer-data-[size=lg]/menu-button:top-2.5',
        'vs:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = `${Math.floor(Math.random() * 40) + 50}%`

  return (
    <div
      data-sidebar='menu-skeleton'
      data-slot='sidebar-menu-skeleton'
      className={cn(
        'vs:flex vs:h-8 vs:items-center vs:gap-2 vs:rounded-md vs:px-2',
        className,
      )}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className='vs:size-4 vs:rounded-md'
          data-sidebar='menu-skeleton-icon'
        />
      )}
      <Skeleton
        className='vs:h-4 vs:max-w-(--skeleton-width) vs:flex-1'
        data-sidebar='menu-skeleton-text'
        style={
          {
            '--skeleton-width': width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({className, ...props}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-sidebar='menu-sub'
      data-slot='sidebar-menu-sub'
      className={cn(
        'vs:border-sidebar-border vs:mx-3.5 vs:flex vs:min-w-0 vs:translate-x-px vs:flex-col vs:gap-1 vs:border-l vs:px-2.5 vs:py-0.5',
        'vs:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({className, ...props}: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('vs:group/menu-sub-item vs:relative', className)}
      data-sidebar='menu-sub-item'
      data-slot='sidebar-menu-sub-item'
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  size?: 'md' | 'sm'
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      data-size={size}
      data-active={isActive}
      data-sidebar='menu-sub-button'
      data-slot='sidebar-menu-sub-button'
      className={cn(
        'vs:text-sidebar-foreground vs:ring-sidebar-ring vs:hover:bg-sidebar-accent vs:hover:text-sidebar-accent-foreground vs:active:bg-sidebar-accent vs:active:text-sidebar-accent-foreground vs:[&>svg]:text-sidebar-accent-foreground vs:flex vs:h-7 vs:min-w-0 vs:-translate-x-px vs:items-center vs:gap-2 vs:overflow-hidden vs:rounded-md vs:px-2 vs:outline-hidden vs:focus-visible:ring-2 vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:aria-disabled:pointer-events-none vs:aria-disabled:opacity-50 vs:[&>span:last-child]:truncate vs:[&>svg]:size-4 vs:[&>svg]:shrink-0',
        'vs:data-[active=true]:bg-sidebar-accent vs:data-[active=true]:text-sidebar-accent-foreground',
        size === 'sm' && 'vs:text-xs',
        size === 'md' && 'vs:text-sm',
        'vs:group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
