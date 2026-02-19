'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn('vs:flex vs:flex-col vs:gap-2', className)}
      data-slot='tabs'
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      className={cn(
        'vs:bg-muted vs:text-muted-foreground vs:inline-flex vs:h-9 vs:w-fit vs:items-center vs:justify-center vs:rounded-lg vs:p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        "vs:data-[state=active]:bg-background vs:dark:data-[state=active]:text-foreground vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:outline-ring vs:dark:data-[state=active]:border-input vs:dark:data-[state=active]:bg-input/30 vs:text-foreground vs:dark:text-muted-foreground vs:inline-flex vs:h-[calc(100%-1px)] vs:flex-1 vs:items-center vs:justify-center vs:gap-1.5 vs:rounded-md vs:border vs:border-transparent vs:px-2 vs:py-1 vs:text-sm vs:font-medium vs:whitespace-nowrap vs:transition-[color,box-shadow] vs:focus-visible:ring-[3px] vs:focus-visible:outline-1 vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:data-[state=active]:shadow-sm vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0 vs:[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('vs:flex-1 vs:outline-none', className)}
      data-slot='tabs-content'
      {...props}
    />
  )
}

export {Tabs, TabsContent, TabsList, TabsTrigger}
