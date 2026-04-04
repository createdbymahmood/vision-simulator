import {debounce} from '@lodash-es'
import React from 'react'

export const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  const debouncedSetter = React.useMemo(
    () => debounce((next: T) => setDebouncedValue(next), delay),
    [delay],
  )

  React.useEffect(() => {
    debouncedSetter(value)
    return () => {
      debouncedSetter.cancel()
    }
  }, [debouncedSetter, value])

  return debouncedValue
}
