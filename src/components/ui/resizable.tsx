import {GripVerticalIcon} from 'lucide-react'
import * as React from 'react'
import {Group, Panel, Separator} from 'react-resizable-panels'

import {cn} from '@/lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot='resizable-panel-group'
      className={cn(
        'vs:flex vs:h-full vs:w-full vs:data-[panel-group-direction=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel({...props}: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot='resizable-panel' {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) {
  return (
    <Separator
      data-slot='resizable-handle'
      className={cn(
        'vs:bg-border vs:focus-visible:ring-ring vs:relative vs:flex vs:w-px vs:items-center vs:justify-center vs:after:absolute vs:after:inset-y-0 vs:after:left-1/2 vs:after:w-1 vs:after:-translate-x-1/2 vs:focus-visible:ring-1 vs:focus-visible:ring-offset-1 vs:focus-visible:outline-hidden vs:data-[panel-group-direction=vertical]:h-px vs:data-[panel-group-direction=vertical]:w-full vs:data-[panel-group-direction=vertical]:after:left-0 vs:data-[panel-group-direction=vertical]:after:h-1 vs:data-[panel-group-direction=vertical]:after:w-full vs:data-[panel-group-direction=vertical]:after:translate-x-0 vs:data-[panel-group-direction=vertical]:after:-translate-y-1/2 vs:[&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className='vs:bg-border vs:z-10 vs:flex vs:h-4 vs:w-3 vs:items-center vs:justify-center vs:rounded-xs vs:border'>
          <GripVerticalIcon className='vs:size-2.5' />
        </div>
      )}
    </Separator>
  )
}

export {ResizableHandle, ResizablePanel, ResizablePanelGroup}
