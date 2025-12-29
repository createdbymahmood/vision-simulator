import {useCallbackRef} from '@radix-ui/react-use-callback-ref'
import React from 'react'

import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'

interface NumberFieldProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  const handleChange = useCallbackRef(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.target.value)
      if (Number.isNaN(next)) {
        return
      }
      onChange(next)
    },
  )

  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Input
        max={max}
        min={min}
        step={step}
        type='number'
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  const handleSliderChange = useCallbackRef((values: number[]) => {
    const next = values[0]
    if (typeof next !== 'number') {
      return
    }
    onChange(next)
  })

  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between text-sm'>
        <Label>{label}</Label>
        <span className='text-muted-foreground'>{value.toFixed(2)}</span>
      </div>
      <Slider
        max={max}
        min={min}
        step={step}
        value={[value]}
        onValueChange={handleSliderChange}
      />
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
}) => {
  const handleChange = useCallbackRef(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange(event.target.value),
  )

  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Input type='color' value={value} onChange={handleChange} />
    </div>
  )
}

interface SwitchFieldProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  checked,
  onCheckedChange,
}) => {
  const handleChange = useCallbackRef((next: boolean) => onCheckedChange(next))
  return (
    <div className='flex items-center justify-between py-2'>
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={handleChange} />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: {value: string; label: string}[]
  onChange: (value: string) => void
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const handleChange = useCallbackRef((next: string) => onChange(next))

  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

NumberField.displayName = 'number-field'
SliderField.displayName = 'slider-field'
ColorField.displayName = 'color-field'
SwitchField.displayName = 'switch-field'
SelectField.displayName = 'select-field'
