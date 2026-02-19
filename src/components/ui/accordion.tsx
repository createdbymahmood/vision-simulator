import * as AccordionPrimitive from '@radix-ui/react-accordion'
import {ChevronDownIcon} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot='accordion' {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn('vs:border-b vs:last:border-b-0', className)}
      data-slot='accordion-item'
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className='vs:flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:flex vs:flex-1 vs:items-start vs:justify-between vs:gap-4 vs:rounded-md vs:py-4 vs:text-left vs:text-sm vs:font-medium vs:transition-all vs:outline-none vs:hover:underline vs:focus-visible:ring-[3px] vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className='vs:text-muted-foreground vs:pointer-events-none vs:size-4 vs:shrink-0 vs:translate-y-0.5 vs:transition-transform vs:duration-200' />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className='vs:data-[state=closed]:animate-accordion-up vs:data-[state=open]:animate-accordion-down vs:overflow-hidden vs:text-sm'
      data-slot='accordion-content'
      {...props}
    >
      <div className={cn('vs:pt-0 vs:pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export {Accordion, AccordionContent, AccordionItem, AccordionTrigger}
