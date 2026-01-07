import React from 'react'

import {ScrollArea} from '@/components/ui/scroll-area'
import {Separator} from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import {cn} from '@/lib/utils'

interface PropertiesShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  entityId?: string
  entityName?: string
  icon?: React.ReactNode
  accentColor?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export const PropertiesShell: React.FC<PropertiesShellProps> = ({
  open,
  onOpenChange,
  title,
  entityId,
  entityName,
  icon,
  accentColor,
  actions,
  children,
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side='right'
      className='w-[360px] gap-0 border-l bg-background px-0 backdrop-blur'
      style={{width: 360}}
    >
      <SheetHeader className='border-b px-4 py-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            {icon ? (
              <div className='flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground'>
                {icon}
              </div>
            ) : null}
            <div className='flex min-w-0 flex-col text-left leading-tight gap-1'>
              <SheetTitle className='flex items-center gap-2 text-base'>
                <span className='truncate'>{entityName ?? title}</span>
                {accentColor ? (
                  <span
                    aria-hidden
                    className='size-2.5 rounded-full'
                    style={{backgroundColor: accentColor}}
                  />
                ) : null}
              </SheetTitle>
              <p className='text-xs text-muted-foreground'>
                {title}
                {entityId ? ` • ${entityId}` : ''}
              </p>
            </div>
          </div>
          {actions}
        </div>
      </SheetHeader>

      <ScrollArea className='h-[calc(100vh-56px)] px-4 py-4'>
        {children}
      </ScrollArea>
    </SheetContent>
  </Sheet>
)

interface PropertiesSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export const PropertiesSection: React.FC<PropertiesSectionProps> = ({
  title,
  children,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    <div className='flex items-center justify-between'>
      <p className='text-sm font-medium text-foreground'>{title}</p>
    </div>
    <Separator />
    <div className='space-y-4'>{children}</div>
  </div>
)
