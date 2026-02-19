'use client'

/* eslint-disable @typescript-eslint/naming-convention */

import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  )

  return (
    <SliderPrimitive.Root
      defaultValue={defaultValue}
      max={max}
      min={min}
      value={value}
      data-slot='slider'
      className={cn(
        'vs:relative vs:flex vs:w-full vs:touch-none vs:items-center vs:select-none vs:data-[disabled]:opacity-50 vs:data-[orientation=vertical]:h-full vs:data-[orientation=vertical]:min-h-44 vs:data-[orientation=vertical]:w-auto vs:data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot='slider-track'
        className={cn(
          'vs:bg-muted vs:relative vs:grow vs:overflow-hidden vs:rounded-full vs:data-[orientation=horizontal]:h-1.5 vs:data-[orientation=horizontal]:w-full vs:data-[orientation=vertical]:h-full vs:data-[orientation=vertical]:w-1.5',
        )}
      >
        <SliderPrimitive.Range
          data-slot='slider-range'
          className={cn(
            'vs:bg-primary vs:absolute vs:data-[orientation=horizontal]:h-full vs:data-[orientation=vertical]:w-full',
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({length: _values.length}, (_, index) => (
        <SliderPrimitive.Thumb
          className='vs:border-primary vs:ring-ring/50 vs:block vs:size-4 vs:shrink-0 vs:rounded-full vs:border vs:bg-white vs:shadow-sm vs:transition-[color,box-shadow] vs:hover:ring-4 vs:focus-visible:ring-4 vs:focus-visible:outline-hidden vs:disabled:pointer-events-none vs:disabled:opacity-50'
          key={index}
          data-slot='slider-thumb'
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export {Slider}
