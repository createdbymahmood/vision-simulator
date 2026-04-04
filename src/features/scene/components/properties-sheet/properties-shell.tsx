import {Trash01} from '@untitledui/icons'
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
      <Button
        size='icon-sm'
        aria-label={buttonLabel}
        title={buttonLabel}
        variant='destructive'
      >
        <Trash01 className='vs:size-4' />
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
      className='vs:fixed vs:left-16 vs:top-16 vs:z-40 vs:w-[360px] vs:max-w-[calc(100vw-8rem)]'
      onWheelCapture={(event) => event.stopPropagation()}
    >
      <div className='vs:bg-background vs:supports-[backdrop-filter]:bg-background/95 vs:flex vs:max-h-[calc(100vh-8rem)] vs:flex-col vs:overflow-hidden vs:rounded-xl vs:border vs:shadow-lg vs:backdrop-blur'>
        <div className='vs:border-b vs:px-4 vs:py-3'>
          <div className='vs:flex vs:items-center vs:justify-between vs:gap-3'>
            <div className='vs:flex vs:min-w-0 vs:items-center vs:gap-3'>
              {icon ? (
                <div className='vs:flex vs:size-10 vs:items-center vs:justify-center vs:rounded-md vs:bg-muted vs:text-muted-foreground'>
                  {icon}
                </div>
              ) : null}
              <div className='vs:flex vs:min-w-0 vs:flex-col vs:gap-1 vs:leading-tight vs:text-left'>
                <p className='vs:flex vs:items-center vs:gap-2 vs:text-base vs:font-semibold'>
                  <span className='vs:truncate'>{entityName ?? title}</span>
                  {accentColor ? (
                    <span
                      aria-hidden
                      className='vs:size-2.5 vs:rounded-full'
                      style={{backgroundColor: accentColor}}
                    />
                  ) : null}
                </p>
                <p className='vs:text-xs vs:text-muted-foreground'>
                  {title}
                  {entityId ? ` • ${entityId}` : ''}
                </p>
              </div>
            </div>

            <div className='vs:flex vs:items-center vs:gap-1'>
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
                  <ChevronDown className='vs:size-4' />
                ) : (
                  <ChevronUp className='vs:size-4' />
                )}
              </Button>
              <Button
                size='icon-sm'
                aria-label='Close properties'
                title='Close'
                variant='ghost'
                onClick={() => onOpenChange(false)}
              >
                <X className='vs:size-4' />
              </Button>
            </div>
          </div>
        </div>

        <Collapsible
          className='vs:min-h-0 vs:flex vs:flex-1 vs:flex-col'
          open={!collapsed}
        >
          <CollapsibleContent className='vs:min-h-0 vs:flex-1 vs:overflow-y-auto vs:p-4'>
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
  <div className={cn('vs:space-y-3', className)}>
    <div className='vs:flex vs:items-center vs:justify-between'>
      <p className='vs:text-xs vs:font-medium vs:text-muted-foreground'>
        {title}
      </p>
    </div>
    <Separator />
    <div className='vs:space-y-4'>{children}</div>
  </div>
)
