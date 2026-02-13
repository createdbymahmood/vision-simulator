import {ChevronDown, ChevronUp, X} from 'lucide-react'
import React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Collapsible, CollapsibleContent} from '@/components/ui/collapsible'
import {Separator} from '@/components/ui/separator'
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

interface PropertiesDeleteActionProps {
  confirmTitle: string
  confirmDescription: string
  onConfirm: () => void
  buttonLabel?: string
}

export const PropertiesDeleteAction: React.FC<PropertiesDeleteActionProps> = ({
  confirmTitle,
  confirmDescription,
  onConfirm,
  buttonLabel = 'Delete',
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button size='sm' variant='destructive'>
        {buttonLabel}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
        <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction variant='destructive' onClick={onConfirm}>
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

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
}) => {
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setCollapsed(false)
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className='fixed left-16 top-16 z-40 w-[360px] max-w-[calc(100vw-8rem)]'
      onWheelCapture={(event) => event.stopPropagation()}
    >
      <div className='bg-background supports-[backdrop-filter]:bg-background/95 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border shadow-lg backdrop-blur'>
        <div className='border-b px-4 py-3'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              {icon ? (
                <div className='flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground'>
                  {icon}
                </div>
              ) : null}
              <div className='flex min-w-0 flex-col gap-1 leading-tight text-left'>
                <p className='flex items-center gap-2 text-base font-semibold'>
                  <span className='truncate'>{entityName ?? title}</span>
                  {accentColor ? (
                    <span
                      aria-hidden
                      className='size-2.5 rounded-full'
                      style={{backgroundColor: accentColor}}
                    />
                  ) : null}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {title}
                  {entityId ? ` • ${entityId}` : ''}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-1'>
              {actions}
              <Button
                size='icon-sm'
                title={collapsed ? 'Expand' : 'Collapse'}
                variant='ghost'
                onClick={() => setCollapsed((previous) => !previous)}
                aria-label={
                  collapsed ? 'Expand properties' : 'Collapse properties'
                }
              >
                {collapsed ? (
                  <ChevronDown className='size-4' />
                ) : (
                  <ChevronUp className='size-4' />
                )}
              </Button>
              <Button
                size='icon-sm'
                aria-label='Close properties'
                title='Close'
                variant='ghost'
                onClick={() => onOpenChange(false)}
              >
                <X className='size-4' />
              </Button>
            </div>
          </div>
        </div>

        <Collapsible className='min-h-0 flex flex-1 flex-col' open={!collapsed}>
          <CollapsibleContent className='min-h-0 flex-1 overflow-y-auto p-4'>
            {children}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

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
      <p className='text-xs font-medium text-muted-foreground'>{title}</p>
    </div>
    <Separator />
    <div className='space-y-4'>{children}</div>
  </div>
)
