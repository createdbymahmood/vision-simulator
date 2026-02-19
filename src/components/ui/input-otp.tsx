import {OTPInput, OTPInputContext} from 'input-otp'
import {MinusIcon} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      className={cn('vs:disabled:cursor-not-allowed', className)}
      containerClassName={cn(
        'vs:flex vs:items-center vs:gap-2 vs:has-disabled:opacity-50',
        containerClassName,
      )}
      data-slot='input-otp'
      {...props}
    />
  )
}

function InputOTPGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:flex vs:items-center', className)}
      data-slot='input-otp-group'
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const {char, hasFakeCaret, isActive} = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-active={isActive}
      data-slot='input-otp-slot'
      className={cn(
        'vs:data-[active=true]:border-ring vs:data-[active=true]:ring-ring/50 vs:data-[active=true]:aria-invalid:ring-destructive/20 vs:dark:data-[active=true]:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:data-[active=true]:aria-invalid:border-destructive vs:dark:bg-input/30 vs:border-input vs:relative vs:flex vs:h-9 vs:w-9 vs:items-center vs:justify-center vs:border-y vs:border-r vs:text-sm vs:shadow-xs vs:transition-all vs:outline-none vs:first:rounded-l-md vs:first:border-l vs:last:rounded-r-md vs:data-[active=true]:z-10 vs:data-[active=true]:ring-[3px]',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className='vs:pointer-events-none vs:absolute vs:inset-0 vs:flex vs:items-center vs:justify-center'>
          <div className='vs:animate-caret-blink vs:bg-foreground vs:h-4 vs:w-px vs:duration-1000' />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({...props}: React.ComponentProps<'div'>) {
  return (
    <div data-slot='input-otp-separator' role='separator' {...props}>
      <MinusIcon />
    </div>
  )
}

export {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot}
