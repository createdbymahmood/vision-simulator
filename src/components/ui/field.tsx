import type {VariantProps} from 'class-variance-authority'

import {cva} from 'class-variance-authority'
import {useMemo} from 'react'

import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'

function FieldSet({className, ...props}: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot='field-set'
      className={cn(
        'vs:flex vs:flex-col vs:gap-6',
        'vs:has-[>[data-slot=checkbox-group]]:gap-3 vs:has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & {variant?: 'label' | 'legend'}) {
  return (
    <legend
      data-variant={variant}
      data-slot='field-legend'
      className={cn(
        'vs:mb-3 vs:font-medium',
        'vs:data-[variant=legend]:text-base',
        'vs:data-[variant=label]:text-sm',
        className,
      )}
      {...props}
    />
  )
}

function FieldGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='field-group'
      className={cn(
        'vs:group/field-group vs:@container/field-group vs:flex vs:w-full vs:flex-col vs:gap-7 vs:data-[slot=checkbox-group]:gap-3 vs:[&>[data-slot=field-group]]:gap-4',
        className,
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  'vs:group/field vs:flex vs:w-full vs:gap-3 vs:data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['vs:flex-col vs:[&>*]:w-full vs:[&>.sr-only]:w-auto'],
        horizontal: [
          'vs:flex-row vs:items-center',
          'vs:[&>[data-slot=field-label]]:flex-auto',
          'vs:has-[>[data-slot=field-content]]:items-start vs:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
        responsive: [
          'vs:flex-col vs:[&>*]:w-full vs:[&>.sr-only]:w-auto vs:@md/field-group:flex-row vs:@md/field-group:items-center vs:@md/field-group:[&>*]:w-auto',
          'vs:@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          'vs:@md/field-group:has-[>[data-slot=field-content]]:items-start vs:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
)

function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={cn(fieldVariants({orientation}), className)}
      data-orientation={orientation}
      data-slot='field'
      role='group'
      {...props}
    />
  )
}

function FieldContent({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='field-content'
      className={cn(
        'vs:group/field-content vs:flex vs:flex-1 vs:flex-col vs:gap-1.5 vs:leading-snug',
        className,
      )}
      {...props}
    />
  )
}

function FieldLabel({className, ...props}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot='field-label'
      className={cn(
        'vs:group/field-label vs:peer/field-label vs:flex vs:w-fit vs:gap-2 vs:leading-snug vs:group-data-[disabled=true]/field:opacity-50',
        'vs:has-[>[data-slot=field]]:w-full vs:has-[>[data-slot=field]]:flex-col vs:has-[>[data-slot=field]]:rounded-md vs:has-[>[data-slot=field]]:border vs:[&>*]:data-[slot=field]:p-4',
        'vs:has-data-[state=checked]:bg-primary/5 vs:has-data-[state=checked]:border-primary vs:dark:has-data-[state=checked]:bg-primary/10',
        className,
      )}
      {...props}
    />
  )
}

function FieldTitle({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='field-label'
      className={cn(
        'vs:flex vs:w-fit vs:items-center vs:gap-2 vs:text-sm vs:leading-snug vs:font-medium vs:group-data-[disabled=true]/field:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function FieldDescription({className, ...props}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot='field-description'
      className={cn(
        'vs:text-muted-foreground vs:text-sm vs:leading-normal vs:font-normal vs:group-has-[[data-orientation=horizontal]]/field:text-balance',
        'vs:last:mt-0 vs:nth-last-2:-mt-1 vs:[[data-variant=legend]+&]:-mt-1.5',
        'vs:[&>a:hover]:text-primary vs:[&>a]:underline vs:[&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-content={!!children}
      data-slot='field-separator'
      className={cn(
        'vs:relative vs:-my-2 vs:h-5 vs:text-sm vs:group-data-[variant=outline]/field-group:-mb-2',
        className,
      )}
      {...props}
    >
      <Separator className='vs:absolute vs:inset-0 vs:top-1/2' />
      {children && (
        <span
          className='vs:bg-background vs:text-muted-foreground vs:relative vs:mx-auto vs:block vs:w-fit vs:px-2'
          data-slot='field-separator-content'
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: ({message?: string} | undefined)[]
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className='vs:ml-4 vs:flex vs:list-disc vs:flex-col vs:gap-1'>
        {uniqueErrors.map((error, index) =>
          error?.message ? (
            <li key={error.message ?? index}>{error.message}</li>
          ) : null,
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      className={cn('vs:text-destructive vs:text-sm vs:font-normal', className)}
      data-slot='field-error'
      role='alert'
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}
