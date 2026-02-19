'use client'

/* eslint-disable max-lines-per-function, @eslint-react/no-nested-component-definitions, @typescript-eslint/no-shadow */

import type {DayButton} from 'react-day-picker'

import {ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon} from 'lucide-react'
import * as React from 'react'
import {DayPicker, getDefaultClassNames} from 'react-day-picker'

import {Button, buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant']
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      captionLayout={captionLayout}
      components={{
        Root: ({className, rootRef, ...props}) => {
          return (
            <div
              className={cn(className)}
              ref={rootRef}
              data-slot='calendar'
              {...props}
            />
          )
        },
        Chevron: ({className, orientation, ...props}) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon
                className={cn('vs:size-4', className)}
                {...props}
              />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('vs:size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon
              className={cn('vs:size-4', className)}
              {...props}
            />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({children, ...props}) => {
          return (
            <td {...props}>
              <div className='vs:flex vs:size-(--cell-size) vs:items-center vs:justify-center vs:text-center'>
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', {month: 'short'}),
        ...formatters,
      }}
      showOutsideDays={showOutsideDays}
      className={cn(
        'vs:bg-background vs:group/calendar vs:p-3 vs:[--cell-size:--spacing(8)] vs:[[data-slot=card-content]_&]:bg-transparent vs:[[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      classNames={{
        root: cn('vs:w-fit', defaultClassNames.root),
        months: cn(
          'vs:flex vs:gap-4 vs:flex-col vs:md:flex-row vs:relative',
          defaultClassNames.months,
        ),
        month: cn(
          'vs:flex vs:flex-col vs:w-full vs:gap-4',
          defaultClassNames.month,
        ),
        nav: cn(
          'vs:flex vs:items-center vs:gap-1 vs:w-full vs:absolute vs:top-0 vs:inset-x-0 vs:justify-between',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({variant: buttonVariant}),
          'vs:size-(--cell-size) vs:aria-disabled:opacity-50 vs:p-0 vs:select-none',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({variant: buttonVariant}),
          'vs:size-(--cell-size) vs:aria-disabled:opacity-50 vs:p-0 vs:select-none',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'vs:flex vs:items-center vs:justify-center vs:h-(--cell-size) vs:w-full vs:px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          'vs:w-full vs:flex vs:items-center vs:text-sm vs:font-medium vs:justify-center vs:h-(--cell-size) vs:gap-1.5',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          'vs:relative vs:has-focus:border-ring vs:border vs:border-input vs:shadow-xs vs:has-focus:ring-ring/50 vs:has-focus:ring-[3px] vs:rounded-md',
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          'vs:absolute vs:bg-popover vs:inset-0 vs:opacity-0',
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          'vs:select-none vs:font-medium',
          captionLayout === 'label'
            ? 'vs:text-sm'
            : 'vs:rounded-md vs:pl-2 vs:pr-1 vs:flex vs:items-center vs:gap-1 vs:text-sm vs:h-8 vs:[&>svg]:text-muted-foreground vs:[&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        table: 'w-full border-collapse',
        weekdays: cn('vs:flex', defaultClassNames.weekdays),
        weekday: cn(
          'vs:text-muted-foreground vs:rounded-md vs:flex-1 vs:font-normal vs:text-[0.8rem] vs:select-none',
          defaultClassNames.weekday,
        ),
        week: cn('vs:flex vs:w-full vs:mt-2', defaultClassNames.week),
        week_number_header: cn(
          'vs:select-none vs:w-(--cell-size)',
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          'vs:text-[0.8rem] vs:select-none vs:text-muted-foreground',
          defaultClassNames.week_number,
        ),
        day: cn(
          'vs:relative vs:w-full vs:h-full vs:p-0 vs:text-center vs:[&:last-child[data-selected=true]_button]:rounded-r-md vs:group/day vs:aspect-square vs:select-none',
          props.showWeekNumber
            ? 'vs:[&:nth-child(2)[data-selected=true]_button]:rounded-l-md'
            : 'vs:[&:first-child[data-selected=true]_button]:rounded-l-md',
          defaultClassNames.day,
        ),
        range_start: cn(
          'vs:rounded-l-md vs:bg-accent',
          defaultClassNames.range_start,
        ),
        range_middle: cn('vs:rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'vs:rounded-r-md vs:bg-accent',
          defaultClassNames.range_end,
        ),
        today: cn(
          'vs:bg-accent vs:text-accent-foreground vs:rounded-md vs:data-[selected=true]:rounded-none',
          defaultClassNames.today,
        ),
        outside: cn(
          'vs:text-muted-foreground vs:aria-selected:text-muted-foreground',
          defaultClassNames.outside,
        ),
        disabled: cn(
          'vs:text-muted-foreground vs:opacity-50',
          defaultClassNames.disabled,
        ),
        hidden: cn('vs:invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      size='icon'
      data-day={day.date.toLocaleDateString()}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-range-start={modifiers.range_start}
      ref={ref}
      variant='ghost'
      className={cn(
        'vs:data-[selected-single=true]:bg-primary vs:data-[selected-single=true]:text-primary-foreground vs:data-[range-middle=true]:bg-accent vs:data-[range-middle=true]:text-accent-foreground vs:data-[range-start=true]:bg-primary vs:data-[range-start=true]:text-primary-foreground vs:data-[range-end=true]:bg-primary vs:data-[range-end=true]:text-primary-foreground vs:group-data-[focused=true]/day:border-ring vs:group-data-[focused=true]/day:ring-ring/50 vs:dark:hover:text-accent-foreground vs:flex vs:aspect-square vs:size-auto vs:w-full vs:min-w-(--cell-size) vs:flex-col vs:gap-1 vs:leading-none vs:font-normal vs:group-data-[focused=true]/day:relative vs:group-data-[focused=true]/day:z-10 vs:group-data-[focused=true]/day:ring-[3px] vs:data-[range-end=true]:rounded-md vs:data-[range-end=true]:rounded-r-md vs:data-[range-middle=true]:rounded-none vs:data-[range-start=true]:rounded-md vs:data-[range-start=true]:rounded-l-md vs:[&>span]:text-xs vs:[&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      {...props}
    />
  )
}

export {Calendar, CalendarDayButton}
